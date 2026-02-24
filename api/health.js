export default function handler(req, res) {
  const hasKey = !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your-api-key-here';
  res.json({ status: 'ok', claudeEnabled: hasKey, timestamp: new Date().toISOString() });
}
