import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-20250514';

function getSystemPrompt(examBoard) {
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { topicId, topicName, phase, difficulty, examBoard, subskills, misconceptions } = req.body;

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
      system: getSystemPrompt(examBoard),
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
}
