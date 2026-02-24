import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-20250514';

const SUBJECT_NAMES = { biology: 'Biology', chemistry: 'Chemistry', mathematics: 'Mathematics' };

// ─── Input Validation Helpers ───

const MAX_STRING = 500;
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

// ─── System Prompts ───

function getBiologyPrompt(examBoard) {
  return `You are an expert A-level Biology examiner creating exam-style questions. You create questions aligned to UK A-level Biology standards (AQA, OCR, Edexcel).

EXAM BOARD CONTEXT:
${examBoard === 'aqa' ? '- AQA (7402): Straightforward, concept-focused. "Explain why...", "Describe..." style. More 2-4 mark questions.' :
  examBoard === 'ocr' ? '- OCR (H567): Data-heavy, practical-skills focused. "Using the data provided...", "Evaluate..." style. Often includes tables/graphs context.' :
  examBoard === 'edexcel' ? '- Edexcel (9401): Balanced approach. Mix of calculation and reasoning. "Explain...", "Evaluate..." style.' :
  '- Generic UK A-level Biology standard.'}

RULES:
1. Questions must be factually accurate and exam-appropriate
2. For recall: short, precise questions testing definitions, naming, or single facts (1-2 marks)
3. For application: scenario-based questions requiring understanding, not just recall (3-4 marks)
4. For extended: 6-mark essay-style questions requiring structured argument with multiple linked points
5. Include clear marking criteria with specific keywords/rubric points
6. Note common misconceptions students might have
7. Align difficulty to the requested level (1=easy, 5=hard)

You MUST respond with valid JSON only. No markdown, no explanation outside the JSON.`;
}

function getChemistryPrompt(examBoard) {
  return `You are an expert A-level Chemistry examiner creating exam-style questions. You create questions aligned to UK A-level Chemistry standards (AQA, OCR, Edexcel).

EXAM BOARD CONTEXT:
${examBoard === 'aqa' ? '- AQA (7405): Straightforward, calculation-heavy, structured mark schemes. Mark per step in calculations.' :
  examBoard === 'ocr' ? '- OCR (H432): Practical skills emphasis, context-heavy, real-world applications. More open-ended questions.' :
  examBoard === 'edexcel' ? '- Edexcel (9CH0): Balanced, context-based, application-heavy. Frequent "use the data" questions.' :
  '- Generic UK A-level Chemistry standard.'}

CHEMISTRY-SPECIFIC RULES:
1. Questions must be factually accurate and exam-appropriate
2. For recall: test definitions, naming, oxidation states, or single-step facts (1-2 marks)
3. For application: scenario-based OR calculation questions requiring multi-step working (3-4 marks)
4. For extended: 6-mark questions combining calculation with explanation, or multi-part problems
5. Include clear marking criteria with specific keywords/rubric points
6. For calculation questions: include expected numerical answers, required working steps, and unit requirements
7. For mechanism questions: accept text descriptions of electron movement, curly arrows, and intermediates
8. Align difficulty to the requested level (1=easy, 5=hard)

CALCULATION RULES:
- Always specify data needed (Ar values, Mr values, concentrations, volumes)
- Mark scheme must award marks for method/working, not just final answer
- State required units explicitly
- Include tolerance for rounding where appropriate

MISCONCEPTIONS TO TARGET:
- Bond breaking requires energy (endothermic), bond forming releases energy (exothermic)
- pH is a log scale (pH 2 is 100x more acidic than pH 4)
- Catalysts provide alternative pathway with lower Ea, they do NOT give particles more energy
- Kc only changes with temperature, NOT with concentration or pressure changes
- Strong acid != concentrated acid (strength is about dissociation, not amount)

You MUST respond with valid JSON only. No markdown, no explanation outside the JSON.`;
}

function getMathematicsPrompt(examBoard) {
  return `You are an expert A-level Mathematics examiner creating exam-style questions. You create questions aligned to UK A-level Mathematics standards (AQA, OCR, Edexcel).

EXAM BOARD CONTEXT:
${examBoard === 'aqa' ? '- AQA (7357): Proof-heavy, structured questions, clear method marks. Expect "Show that..." and proof questions.' :
  examBoard === 'ocr' ? '- OCR (H240): Applied focus, modelling questions, real-world contexts. Frequent "Interpret..." and contextual problems.' :
  examBoard === 'edexcel' ? '- Edexcel (9MA0): Balanced pure/applied. Mix of technique and reasoning. "Hence..." and multi-part questions.' :
  '- Generic UK A-level Mathematics standard.'}

MATHEMATICS-SPECIFIC RULES:
1. Questions must be mathematically accurate and exam-appropriate
2. For recall: test definitions, standard results, or single-step calculations (1-2 marks)
3. For application: multi-step problems requiring method and working (3-4 marks)
4. For extended: 6-mark questions combining multiple techniques, proof, or modelling
5. Include clear marking criteria with specific method marks and answer marks
6. For calculation questions: state the expected answer in exact form where appropriate
7. For proof questions: specify the required logical structure and key steps
8. Accept equivalent algebraic forms (e.g., 2(x+3) and 2x+6 are equivalent)
9. Align difficulty to the requested level (1=easy, 5=hard)

WORKING REQUIREMENTS:
- Always specify whether a calculator is allowed or if exact form is required
- Mark scheme must award method marks (M) for correct approach even if arithmetic is wrong
- Award accuracy marks (A) for correct final answers
- For "Show that" questions: all intermediate steps must be visible
- Accept equivalent forms: factored, expanded, simplified, or exact (surd/fraction)

You MUST respond with valid JSON only. No markdown, no explanation outside the JSON.`;
}

function getSystemPrompt(examBoard, subjectId) {
  if (subjectId === 'chemistry') return getChemistryPrompt(examBoard);
  if (subjectId === 'mathematics') return getMathematicsPrompt(examBoard);
  return getBiologyPrompt(examBoard);
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
    const phase = validateEnum(rawBody.phase, VALID_PHASES, null);
    const difficulty = Math.min(5, Math.max(1, Number(rawBody.difficulty) || 3));
    const examBoard = validateEnum(rawBody.examBoard, VALID_BOARDS, 'generic');
    const subjectId = validateEnum(rawBody.subjectId, VALID_SUBJECTS, 'biology');
    const subskills = sanitizeArray(rawBody.subskills, 10, 100);
    const misconceptions = sanitizeArray(rawBody.misconceptions, 10, 200);
    const previousPrompts = sanitizeArray(rawBody.previousPrompts, 10, 500);

    if (!topicId || !phase) {
      return res.status(400).json({ success: false, error: 'Missing topicId or phase' });
    }

    const phaseInstructions = {
      recall: `Generate a RECALL question (1-2 marks). Short, precise. Tests definitions, naming, or single-step facts.
Example: "Define the term 'active site'." or "Name the enzyme that unwinds DNA during replication."`,
      application: `Generate an APPLICATION question (3-4 marks). Scenario-based, requires applying knowledge to a new situation.
Example: "A scientist added substrate to an enzyme solution at 30\u00b0C. The rate of reaction increased rapidly at first, then plateaued. Explain why."`,
      extended: `Generate an EXTENDED RESPONSE question (6 marks). Essay-style requiring structured argument with multiple linked points.
Example: "Describe and explain the relationship between the structure of proteins and their function, using named examples. (6 marks)"`,
    };

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: getSystemPrompt(examBoard, subjectId),
      messages: [{
        role: 'user',
        content: `Generate a ${phase} question for the topic "${topicName || topicId}".
Difficulty: ${difficulty}/5
${subskills.length ? `Focus on these subskills: ${subskills.join(', ')}` : ''}
${misconceptions.length ? `Common misconceptions to potentially test: ${misconceptions.join('; ')}` : ''}
${previousPrompts.length ? `\nIMPORTANT: Do NOT repeat or closely rephrase any of these previously asked questions:\n${previousPrompts.map((p, i) => `${i + 1}. "${p}"`).join('\n')}\nGenerate a DIFFERENT question on a different aspect of the topic.` : ''}

${phaseInstructions[phase] || phaseInstructions.recall}

Respond with this exact JSON structure:
{
  "prompt": "The question text",
  "maxScore": ${phase === 'extended' ? 6 : phase === 'application' ? 4 : 2},
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "rubricPoints": ${phase === 'extended' ? '["Point 1 (1 mark)", "Point 2 (1 mark)", ...]' : 'null'},
  "subskillIds": ["relevant_subskill_id"],
  "hint": "A brief hint for the student",
  "commonErrors": ["Error students commonly make"]
}`
      }],
    });

    const text = message.content[0]?.text || '';
    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      return res.status(500).json({ success: false, error: 'Failed to generate question' });
    }

    res.json({
      success: true,
      data: {
        questionId: `q_${topicId}_${phase}_${Date.now().toString(36)}`,
        topicId,
        subskillIds: parsed.subskillIds || [],
        phase,
        difficulty,
        examBoard,
        format: phase === 'extended' ? 'extended' : 'short',
        prompt: parsed.prompt,
        dataIncluded: null,
        choices: null,
        marking: {
          type: phase === 'extended' ? 'rubric' : 'keyword',
          maxScore: parsed.maxScore,
          rubricPoints: parsed.rubricPoints || null,
          keywords: parsed.keywords || [],
          commonErrors: parsed.commonErrors || [],
        },
        hint: parsed.hint || null,
      },
    });
  } catch (err) {
    console.error('generateQuestion error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to generate question' });
  }
}
