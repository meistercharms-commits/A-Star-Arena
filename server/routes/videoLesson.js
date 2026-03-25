import { Router } from 'express';
import { YoutubeTranscript } from 'youtube-transcript';
import Anthropic from '@anthropic-ai/sdk';
import { verifyToken } from '../middleware/auth.js';
import { checkCredits } from '../middleware/credits.js';

const router = Router();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
const MODEL = 'claude-opus-4-0-20250514';

// Extract YouTube video ID from URL
function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

router.post('/api/claude/videoLesson', verifyToken, checkCredits(5), async (req, res) => {
  try {
    const { youtubeUrl, subjectId, level, examBoard } = req.body;

    if (!youtubeUrl) {
      return res.status(400).json({ success: false, error: 'YouTube URL is required' });
    }

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      return res.status(400).json({ success: false, error: 'Invalid YouTube URL' });
    }

    // Fetch transcript
    let transcript;
    try {
      const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
      transcript = transcriptItems.map(item => item.text).join(' ');
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Could not fetch transcript. The video may not have captions enabled.',
      });
    }

    if (!transcript || transcript.length < 50) {
      return res.status(400).json({
        success: false,
        error: 'Transcript is too short or empty. Try a different video.',
      });
    }

    // Truncate very long transcripts (keep first ~8000 words)
    const words = transcript.split(/\s+/);
    const truncated = words.length > 8000 ? words.slice(0, 8000).join(' ') + '...' : transcript;

    const levelLabel = level === 'gcse' ? 'GCSE' : 'A-Level';
    const subjectLabel = subjectId ? subjectId.charAt(0).toUpperCase() + subjectId.slice(1) : 'General';

    // Send to Claude
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: `You are an expert ${levelLabel} ${subjectLabel} tutor creating a revision lesson from a video transcript. Your job is to extract the key learning points and create quiz questions that test genuine understanding, not just recall of specific phrases from the video.

${examBoard && examBoard !== 'generic' ? `Align questions to ${examBoard.toUpperCase()} exam style where possible.` : ''}

You MUST respond with valid JSON only. No markdown, no explanation outside the JSON.`,
      messages: [{
        role: 'user',
        content: `Based on this video transcript, create a structured revision lesson.

TRANSCRIPT:
${truncated}

Generate a JSON response with this exact structure:
{
  "title": "A clear, descriptive title for this lesson",
  "summary": "2-3 paragraph summary of the key concepts covered",
  "keyTerms": [
    { "term": "Key term", "definition": "Clear definition" }
  ],
  "questions": [
    {
      "id": "q1",
      "phase": "recall",
      "prompt": "Question text",
      "maxScore": 2,
      "keywords": ["expected", "answer", "keywords"],
      "modelAnswer": "A concise model answer"
    },
    {
      "id": "q2",
      "phase": "application",
      "prompt": "Application question requiring deeper thinking",
      "maxScore": 4,
      "keywords": ["expected", "keywords"],
      "modelAnswer": "Model answer showing application"
    }
  ]
}

Generate 3-4 recall questions (2 marks each) and 3-4 application questions (4 marks each). Questions should test understanding of the concepts, not just memorisation of the transcript.`
      }],
    });

    const text = message.content[0]?.text || '';
    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      return res.status(500).json({ success: false, error: 'Failed to generate lesson from transcript' });
    }

    const lessonId = `vl_${videoId}_${Date.now().toString(36)}`;

    res.json({
      success: true,
      data: {
        lessonId,
        videoId,
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
        title: parsed.title || 'Video Lesson',
        summary: parsed.summary || '',
        keyTerms: parsed.keyTerms || [],
        questions: parsed.questions || [],
        subjectId,
        level,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('videoLesson error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to generate video lesson' });
  }
});

export default router;
