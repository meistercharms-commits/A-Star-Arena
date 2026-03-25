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

export default router;
