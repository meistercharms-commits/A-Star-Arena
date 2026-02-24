import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-20250514';

const SUBJECT_NAMES = { biology: 'Biology', chemistry: 'Chemistry', mathematics: 'Mathematics' };

// ─── Input Validation Helpers ───

const MAX_STRING = 500;
const MAX_ARRAY = 20;
const VALID_SUBJECTS = ['biology', 'chemistry', 'mathematics'];
const VALID_BOARDS = ['generic', 'aqa', 'ocr', 'edexcel'];

function sanitize(str, maxLen = MAX_STRING) {
  if (typeof str !== 'string') return '';
  return str.slice(0, maxLen);
}

function sanitizeArray(arr, maxItems = MAX_ARRAY, maxItemLen = MAX_STRING) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, maxItems).map(item => sanitize(String(item), maxItemLen));
}

function validateEnum(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

// ─── CORS Check ───

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3001,http://127.0.0.1:5173,https://a-star-arena.vercel.app').split(',').map(s => s.trim());

function checkOrigin(req, res) {
  const origin = req.headers?.origin || '';
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    res.status(403).json({ success: false, error: 'Forbidden' });
    return false;
  }
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  return true;
}

// ─── Study Guide Prompt ───

function getStudyGuidePrompt(examBoard, subjectId) {
  const subjectName = SUBJECT_NAMES[subjectId] || 'Biology';
  return `You are an expert A-level ${subjectName} tutor creating personalised study guides. You create targeted revision material aligned to UK A-level standards.

EXAM BOARD: ${examBoard?.toUpperCase() || 'Generic UK A-level'}

Your study guides are personalised based on the student's mastery data, weak subskills, and recurring error patterns. Focus on areas where the student needs the most help.

GUIDE STRUCTURE:
1. Summary: 2-3 sentence overview of the topic and the student's current position
2. Key Concept Cards: Core concepts the student must understand (title, explanation, exam tip for each)
3. Worked Examples: Exam-style questions with model answers showing mark-worthy points
4. Exam Tips: Practical advice for answering questions on this topic
5. Weak Spot Focus: Personalised advice targeting the student's specific weaknesses

RULES:
- Use precise ${subjectName} terminology throughout
- Keep explanations clear and concise — suitable for A-level students
- Exam tips should reference mark scheme conventions
- Worked examples should show the level of detail expected for full marks
- Weak spot advice should be actionable and specific

You MUST respond with valid JSON only. No markdown, no explanation outside the JSON.`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!checkOrigin(req, res)) return;

  try {
    const rawBody = req.body;

    // Validate & sanitize inputs
    const topicId = sanitize(rawBody.topicId, 100);
    const topicName = sanitize(rawBody.topicName, 200);
    const subskills = sanitizeArray(rawBody.subskills, 20, 100);
    const examBoard = validateEnum(rawBody.examBoard, VALID_BOARDS, 'generic');
    const subjectId = validateEnum(rawBody.subjectId, VALID_SUBJECTS, 'biology');
    const masteryScore = rawBody.masteryScore != null ? Math.min(1, Math.max(0, Number(rawBody.masteryScore) || 0)) : null;
    const weakSubskills = sanitizeArray(rawBody.weakSubskills, 10, 100);
    const errorPatterns = sanitizeArray(rawBody.errorPatterns, 10, 200);

    if (!topicId || !topicName) {
      return res.status(400).json({ success: false, error: 'Missing topicId or topicName' });
    }

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: getStudyGuidePrompt(examBoard, subjectId),
      messages: [{
        role: 'user',
        content: `Generate a personalised study guide for "${topicName}".

STUDENT CONTEXT:
- Overall mastery for this topic: ${masteryScore != null ? `${Math.round(masteryScore * 100)}%` : 'Unknown'}
- Weak subskills: ${weakSubskills.length ? weakSubskills.join(', ') : 'None identified'}
- Recurring error patterns: ${errorPatterns.length ? errorPatterns.join('; ') : 'None identified'}
- All subskills in topic: ${subskills.length ? subskills.join(', ') : 'Not specified'}

Respond with this exact JSON structure:
{
  "summary": "2-3 sentence overview",
  "keyConceptCards": [
    { "title": "Concept name", "explanation": "Clear explanation", "examTip": "Mark scheme advice" }
  ],
  "workedExamples": [
    { "question": "Exam-style question", "answer": "Full model answer", "marks": 4 }
  ],
  "examTips": ["Tip 1", "Tip 2"],
  "weakSpotFocus": [
    { "subskill": "Weak area name", "issue": "What the student struggles with", "howToFix": "Specific actionable advice" }
  ]
}`
      }],
    });

    const text = message.content[0]?.text || '';
    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      return res.status(500).json({ success: false, error: 'Failed to generate study guide' });
    }

    res.json({
      success: true,
      data: {
        topicId,
        topicName,
        summary: parsed.summary || '',
        keyConceptCards: parsed.keyConceptCards || [],
        workedExamples: parsed.workedExamples || [],
        examTips: parsed.examTips || [],
        weakSpotFocus: parsed.weakSpotFocus || [],
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('generateStudyGuide error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to generate study guide' });
  }
}
