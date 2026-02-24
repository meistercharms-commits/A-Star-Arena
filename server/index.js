import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';

dotenv.config({ path: '.env.local', override: true });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ─── Anthropic Client ───
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-20250514';

// ─── System Prompts ───

const SUBJECT_NAMES = { biology: 'Biology', chemistry: 'Chemistry', mathematics: 'Mathematics' };

// ─── Generate Question Prompts ───

function getBiologyGeneratePrompt(examBoard) {
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

function getChemistryGeneratePrompt(examBoard) {
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

function getMathematicsGeneratePrompt(examBoard) {
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

function getGenerateQuestionPrompt(examBoard, subjectId) {
  if (subjectId === 'chemistry') return getChemistryGeneratePrompt(examBoard);
  if (subjectId === 'mathematics') return getMathematicsGeneratePrompt(examBoard);
  return getBiologyGeneratePrompt(examBoard);
}

// ─── Mark Answer Prompts ───

function getBiologyMarkPrompt(examBoard) {
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

function getChemistryMarkPrompt(examBoard) {
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

function getMathematicsMarkPrompt(examBoard) {
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

function getMarkAnswerPrompt(examBoard, subjectId) {
  if (subjectId === 'chemistry') return getChemistryMarkPrompt(examBoard);
  if (subjectId === 'mathematics') return getMathematicsMarkPrompt(examBoard);
  return getBiologyMarkPrompt(examBoard);
}

// ─── Health Check ───

app.get('/api/health', (req, res) => {
  const hasKey = !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your-api-key-here';
  res.json({ status: 'ok', claudeEnabled: hasKey, timestamp: new Date().toISOString() });
});

// ─── Generate Question ───

app.post('/api/claude/generateQuestion', async (req, res) => {
  try {
    const { topicId, topicName, phase, difficulty, examBoard, subskills, misconceptions, subjectId } = req.body;

    if (!topicId || !phase) {
      return res.status(400).json({ success: false, error: 'Missing topicId or phase' });
    }

    const phaseInstructions = {
      recall: `Generate a RECALL question (1-2 marks). Short, precise. Tests definitions, naming, or single-step facts.
Example: "Define the term 'active site'." or "Name the enzyme that unwinds DNA during replication."`,
      application: `Generate an APPLICATION question (3-4 marks). Scenario-based, requires applying knowledge to a new situation.
Example: "A scientist added substrate to an enzyme solution at 30°C. The rate of reaction increased rapidly at first, then plateaued. Explain why."`,
      extended: `Generate an EXTENDED RESPONSE question (6 marks). Essay-style requiring structured argument with multiple linked points.
Example: "Describe and explain the relationship between the structure of proteins and their function, using named examples. (6 marks)"`,
    };

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: getGenerateQuestionPrompt(examBoard, subjectId),
      messages: [{
        role: 'user',
        content: `Generate a ${phase} question for the topic "${topicName || topicId}".
Difficulty: ${difficulty || 3}/5
${subskills?.length ? `Focus on these subskills: ${subskills.join(', ')}` : ''}
${misconceptions?.length ? `Common misconceptions to potentially test: ${misconceptions.join('; ')}` : ''}

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
      // Extract JSON from response (handle potential markdown wrapping)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      return res.status(500).json({ success: false, error: 'Failed to parse Claude response', raw: text });
    }

    res.json({
      success: true,
      data: {
        questionId: `q_${topicId}_${phase}_${Date.now().toString(36)}`,
        topicId,
        subskillIds: parsed.subskillIds || [],
        phase,
        difficulty: difficulty || 3,
        examBoard: examBoard || 'generic',
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
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Mark Answer ───

app.post('/api/claude/markAnswer', async (req, res) => {
  try {
    const { questionId, questionPrompt, studentAnswer, phase, difficulty, rubric, examBoard, topicId, subjectId } = req.body;

    if (!studentAnswer && studentAnswer !== '') {
      return res.status(400).json({ success: false, error: 'Missing studentAnswer' });
    }

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: getMarkAnswerPrompt(examBoard, subjectId),
      messages: [{
        role: 'user',
        content: `Mark this student's answer to an A-level ${SUBJECT_NAMES[subjectId] || 'Biology'} ${phase} question.

QUESTION: ${questionPrompt}
MAX SCORE: ${rubric?.maxScore || 6}
${rubric?.keywords?.length ? `EXPECTED KEYWORDS: ${rubric.keywords.join(', ')}` : ''}
${rubric?.rubricPoints?.length ? `RUBRIC POINTS:\n${rubric.rubricPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}` : ''}

STUDENT'S ANSWER: "${studentAnswer || '(no answer given)'}"

Mark this answer and respond with this exact JSON structure:
{
  "score": <number 0 to ${rubric?.maxScore || 6}>,
  "maxScore": ${rubric?.maxScore || 6},
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
      return res.status(500).json({ success: false, error: 'Failed to parse Claude response', raw: text });
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
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`A* Arena server running on port ${PORT}`);
});
