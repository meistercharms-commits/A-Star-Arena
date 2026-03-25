import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { verifyToken } from '../middleware/auth.js';
import { checkCredits } from '../middleware/credits.js';

const router = Router();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
const MODEL = 'claude-sonnet-4-6-20250514';

router.post('/api/claude/markPastPaper', verifyToken, checkCredits(1), async (req, res) => {
  try {
    const { questionText, markScheme, studentAnswer, marks, commandWord, examBoard, subjectId, level } = req.body;

    if (!questionText || !markScheme || !studentAnswer) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: `You are a strict UK ${examBoard?.toUpperCase() || 'AQA'} exam marker for ${level === 'gcse' ? 'GCSE' : 'A-Level'} ${subjectId || 'Biology'}.

Mark the student's answer EXACTLY according to the provided mark scheme.
- Award marks ONLY where the student's response matches the mark scheme points.
- Do NOT award marks for information not in the mark scheme.
- Be strict but fair; accept equivalent terminology and phrasing.
- The command word is "${commandWord || 'unknown'}"; assess whether the student has responded appropriately for this command word.

IMPORTANT LANGUAGE RULES:
- Use British English spelling throughout (e.g. colour, analyse, organise, favour, defence, centre, programme, practise as a verb).
- Never use American English spelling (no color, analyze, organize, favor, defense, center, program, practice as a verb).
- Never use em-dashes in any response. Use commas, full stops, colons, or semicolons instead.
- Use "whilst" not "while" where appropriate. Use "amongst" not "among" where appropriate.

You MUST respond with valid JSON only.`,
      messages: [{
        role: 'user',
        content: `QUESTION (${marks} marks): ${questionText}

MARK SCHEME:
${markScheme}

STUDENT'S ANSWER:
${studentAnswer}

Mark this answer. Return JSON:
{
  "score": <number 0-${marks}>,
  "maxMarks": ${marks},
  "matchedPoints": ["mark scheme point 1 that was awarded", ...],
  "missedPoints": ["mark scheme point that was not awarded", ...],
  "feedback": {
    "whatYouDidWell": ["..."],
    "missingPoints": ["..."],
    "howToImprove": ["..."],
    "modelAnswer": "A concise model answer that would achieve full marks"
  }
}`
      }],
    });

    const text = message.content[0]?.text || '';
    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      return res.status(500).json({ success: false, error: 'Failed to parse marking response' });
    }

    res.json({
      success: true,
      data: {
        score: parsed.score || 0,
        maxMarks: parsed.maxMarks || marks,
        matchedPoints: parsed.matchedPoints || [],
        missedPoints: parsed.missedPoints || [],
        feedback: parsed.feedback || {},
      },
    });
  } catch (err) {
    console.error('markPastPaper error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to mark answer' });
  }
});

// ─── Past Paper Hub: AI mark answers against real mark scheme ───
router.post('/api/claude/markPastPaperHub', verifyToken, checkCredits(2), async (req, res) => {
  try {
    const { paperId, paperTitle, answers, markSchemeUrl, examBoard, subjectId, level, totalMarks } = req.body;

    if (!answers?.length) {
      return res.status(400).json({ success: false, error: 'No answers provided' });
    }

    const levelLabel = level === 'gcse' ? 'GCSE' : 'A-Level';
    const boardLabel = (examBoard || 'aqa').toUpperCase();

    const answersText = answers.map(a => `Question ${a.questionNumber}:\n${a.answer}`).join('\n\n---\n\n');

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: `You are a strict UK ${boardLabel} exam marker for ${levelLabel} ${subjectId || 'Biology'}.

The student has completed a real past paper: "${paperTitle}".
The official mark scheme is available at: ${markSchemeUrl}

You must mark each answer as a real examiner would. Be strict but fair. Award marks only where the response matches what the mark scheme requires. Accept equivalent terminology.

IMPORTANT LANGUAGE RULES:
- Use British English spelling throughout.
- Never use em-dashes. Use commas, full stops, colons, or semicolons instead.

Respond with valid JSON only.`,
      messages: [{
        role: 'user',
        content: `Here are the student's answers for "${paperTitle}" (total: ${totalMarks} marks).

${answersText}

Mark each answer. Return JSON:
{
  "totalScore": <number>,
  "percentage": <number 0-100>,
  "questionFeedback": [
    {
      "questionNumber": "1",
      "score": <number>,
      "feedback": "Brief feedback on what was good and what was missed",
      "improvements": ["specific improvement suggestion"]
    }
  ],
  "overallFeedback": "2-3 sentences on overall performance and key areas to revise",
  "weakTopics": ["topic area 1 that needs more revision", "topic area 2"]
}`
      }],
    });

    const text = message.content[0]?.text || '';
    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      return res.status(500).json({ success: false, error: 'Failed to parse marking response' });
    }

    res.json({
      success: true,
      data: {
        totalScore: parsed.totalScore || 0,
        percentage: parsed.percentage || 0,
        questionFeedback: parsed.questionFeedback || [],
        overallFeedback: parsed.overallFeedback || '',
        weakTopics: parsed.weakTopics || [],
      },
    });
  } catch (err) {
    console.error('markPastPaperHub error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to mark answers' });
  }
});

export default router;
