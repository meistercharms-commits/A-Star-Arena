import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-20250514';

const SUBJECT_NAMES = { biology: 'Biology', chemistry: 'Chemistry', mathematics: 'Mathematics' };

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

function getSystemPrompt(examBoard, subjectId) {
  if (subjectId === 'chemistry') return getChemistryMarkingPrompt(examBoard);
  return getBiologyMarkingPrompt(examBoard);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { questionId, questionPrompt, studentAnswer, phase, difficulty, rubric, examBoard, topicId, subjectId } = req.body;

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
}
