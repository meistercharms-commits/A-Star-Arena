const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3001,http://127.0.0.1:5173,https://a-star-arena.vercel.app').split(',').map(s => s.trim());

export default function handler(req, res) {
  const hasKey = !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your-api-key-here';
  const origin = req.headers?.origin || '';
  const isTrusted = !origin || ALLOWED_ORIGINS.includes(origin);

  res.json({
    status: 'ok',
    ...(isTrusted && { claudeEnabled: hasKey }),
    timestamp: new Date().toISOString(),
  });
}
