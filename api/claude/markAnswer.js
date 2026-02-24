import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-20250514';

const SUBJECT_NAMES = { biology: 'Biology', chemistry: 'Chemistry', mathematics: 'Mathematics' };

// ─── Input Validation Helpers ───

const MAX_STRING = 500;
const MAX_ANSWER = 5000;
const MAX_ARRAY = 20;
const VALID_PHASES = ['recall', 'application', 'extended'];
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

// ─── Marking Prompts ───

function getBiologyMarkingPrompt(examBoard) {
  return `You are an expert A-level Biology examiner marking student answers. You mark strictly according to exam-board rubric conventions.

EXAM BOARD: ${examBoard?.toUpperCase() || 'Generic UK A-level'}

MARKING PRINCIPLES:
1. **Mark-scheme aligned**: Award marks for correct biological terminology. Penalise vagueness.
2. **Keyword-driven**: For recall/application, specific keywords must appear. Partial synonyms may earn partial credit.
3. **Extended responses**: Use levels-based marking (0-2: basic, 2-4: developing, 4-6: comprehensive). Reward logical chains of reasoning.
4. **Common errors to penalise**:
   - "Enzyme gets tired/runs out" -> enzymes are not used up
   - "More collisions" without "successful collisions"
   - Confusing substrate with enzyme concentration
   - "Proteins unfold" without mentioning hydrogen bonds breaking
   - "Osmosis is movement of any substance" -> water only
   - Missing the distinction between correlation and causation
5. **Partial credit**: Award marks for partially correct answers. A student who gets 3/4 keywords deserves partial marks.
6. **Be encouraging but honest**: Note what was done well AND what was missing.

You MUST respond with valid JSON only. No markdown, no explanation outside the JSON.`;
}

function getChemistryMarkingPrompt(examBoard) {
  return `You are an expert A-level Chemistry examiner marking student answers. You mark strictly according to exam-board rubric conventions.

EXAM BOARD: ${examBoard?.toUpperCase() || 'Generic UK A-level'}

MARKING PRINCIPLES:
1. **Mark-scheme aligned**: Award marks for correct chemical terminology and accurate calculations.
2. **Keyword-driven**: For recall/application, specific keywords must appear. Partial synonyms may earn partial credit.
3. **Calculation marking**: Award marks for correct method/working even if final answer is wrong. Penalise missing units.
4. **Extended responses**: Use levels-based marking (0-2: basic, 2-4: developing, 4-6: comprehensive). Reward logical chains of reasoning.
5. **Common errors to penalise**:
   - Missing units in calculations (mol/dm3, kJ/mol, etc.)
   - Wrong molar mass values used
   - Stoichiometric ratio errors (not using coefficients from balanced equation)
   - "Bond breaking releases energy" (it requires energy, endothermic)
   - Confusing strong/weak with concentrated/dilute for acids
   - "Catalysts give particles more energy" (they provide alternative pathway with lower Ea)
   - pH scale confusion (pH 2 is NOT twice as acidic as pH 4, it's 100x)
   - Mixing up Kc and Kp, or forgetting Kc only changes with temperature
   - Curly arrows showing atom movement instead of electron pair movement
6. **Calculation tolerance**: Accept answers within +/-2% of expected value for rounding differences.
7. **Working marks**: Award method marks even if arithmetic is wrong (error carried forward principle).
8. **Partial credit**: Award marks for partially correct answers.
9. **Be encouraging but honest**: Note what was done well AND what was missing.

You MUST respond with valid JSON only. No markdown, no explanation outside the JSON.`;
}

function getMathematicsMarkingPrompt(examBoard) {
  return `You are an expert A-level Mathematics examiner marking student answers. You mark strictly according to exam-board rubric conventions.

EXAM BOARD: ${examBoard?.toUpperCase() || 'Generic UK A-level'}

MARKING PRINCIPLES:
1. **Method marks (M)**: Award for correct mathematical approach/setup, even if arithmetic is wrong.
2. **Accuracy marks (A)**: Award for correct final answers following from correct method.
3. **Follow-through marks**: If a student makes an arithmetic error but uses correct method thereafter, award subsequent method marks (error carried forward principle).
4. **Accept equivalent forms**: 2(x+3) = 2x+6; x = 3/2 = 1.5; sqrt(2)/2 = 1/sqrt(2). All equivalent forms earn full marks.
5. **Working requirement**: For multi-mark questions, the working must be shown. A correct answer with no working may not earn full marks.
6. **Common errors to penalise**:
   - d/dx(x^n) = x^(n-1) without the coefficient n
   - Product rule: d/dx(uv) = (du/dx)(dv/dx) instead of u(dv/dx) + v(du/dx)
   - Forgetting +c in indefinite integration
   - sqrt(a+b) = sqrt(a) + sqrt(b) — incorrect splitting of surds
   - sin(A+B) = sin(A) + sin(B) — incorrect trig addition
   - log(a+b) = log(a) + log(b) — incorrect log law (only log(ab) = log(a) + log(b))
   - Squaring both sides of an inequality without considering sign change
   - Proof by example treated as valid mathematical proof
7. **Proof validation**: For proof questions, check logical flow, correct deductions, and that each step follows from the previous.
8. **Partial credit**: Award marks for partially correct methods and working.
9. **Be encouraging but honest**: Note what was done well AND what was missing.

You MUST respond with valid JSON only. No markdown, no explanation outside the JSON.`;
}

function getSystemPrompt(examBoard, subjectId) {
  if (subjectId === 'chemistry') return getChemistryMarkingPrompt(examBoard);
  if (subjectId === 'mathematics') return getMathematicsMarkingPrompt(examBoard);
  return getBiologyMarkingPrompt(examBoard);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!checkOrigin(req, res)) return;

  try {
    const rawBody = req.body;

    // Validate & sanitize inputs
    const questionId = sanitize(rawBody.questionId, 100);
    const questionPrompt = sanitize(rawBody.questionPrompt, 2000);
    const studentAnswer = sanitize(rawBody.studentAnswer ?? '', MAX_ANSWER);
    const phase = validateEnum(rawBody.phase, VALID_PHASES, 'recall');
    const examBoard = validateEnum(rawBody.examBoard, VALID_BOARDS, 'generic');
    const topicId = sanitize(rawBody.topicId, 100);
    const subjectId = validateEnum(rawBody.subjectId, VALID_SUBJECTS, 'biology');
    const rubric = rawBody.rubric || {};
    const maxScore = Math.min(10, Math.max(1, Number(rubric.maxScore) || 6));
    const keywords = sanitizeArray(rubric.keywords, 10, 100);
    const rubricPoints = sanitizeArray(rubric.rubricPoints, 10, 300);

    if (!studentAnswer && studentAnswer !== '') {
      return res.status(400).json({ success: false, error: 'Missing studentAnswer' });
    }

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: getSystemPrompt(examBoard, subjectId),
      messages: [{
        role: 'user',
        content: `Mark this student's answer to an A-level ${SUBJECT_NAMES[subjectId] || 'Biology'} ${phase} question.

QUESTION: ${questionPrompt}
MAX SCORE: ${maxScore}
${keywords.length ? `EXPECTED KEYWORDS: ${keywords.join(', ')}` : ''}
${rubricPoints.length ? `RUBRIC POINTS:\n${rubricPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}` : ''}

STUDENT'S ANSWER: "${studentAnswer || '(no answer given)'}"

Mark this answer and respond with this exact JSON structure:
{
  "score": <number 0 to ${maxScore}>,
  "maxScore": ${maxScore},
  "correct": <true if score >= 70% of maxScore>,
  "rationale": "Brief examiner's rationale for the mark",
  "feedback": {
    "whatYouDidWell": ["Positive point 1", "Positive point 2"],
    "missingPoints": ["Missing concept 1", "Missing concept 2"],
    "incorrectPoints": ["Any factual errors"],
    "howToImprove": ["Specific advice 1", "Specific advice 2"],
    "modelAnswer": "A concise model answer showing all mark-worthy points"
  },
  "matchedKeywords": ["keywords the student correctly used"],
  "missedKeywords": ["keywords the student missed"]
}`
      }],
    });

    const text = message.content[0]?.text || '';
    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      return res.status(500).json({ success: false, error: 'Failed to mark answer' });
    }

    res.json({
      success: true,
      data: {
        questionId,
        score: parsed.score,
        maxScore: parsed.maxScore,
        correct: parsed.correct,
        rationale: parsed.rationale,
        feedback: {
          whatYouDidWell: parsed.feedback?.whatYouDidWell || [],
          missingPoints: parsed.feedback?.missingPoints || [],
          incorrectPoints: parsed.feedback?.incorrectPoints || [],
          howToImprove: parsed.feedback?.howToImprove || [],
          modelAnswer: parsed.feedback?.modelAnswer || '',
        },
        tags: {
          topicId: topicId || 'unknown',
          subskillIds: [],
          errorTypes: parsed.missedKeywords?.length > 0 ? ['missing_keyword'] : [],
          errorKeywords: parsed.missedKeywords || [],
        },
      },
    });
  } catch (err) {
    console.error('markAnswer error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to mark answer' });
  }
}
