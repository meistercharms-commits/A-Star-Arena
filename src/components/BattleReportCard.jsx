import { useRef, useCallback } from 'react';

export default function BattleReportCard({ results, bossName, bossEmoji, topicName, isVictory }) {
  const canvasRef = useRef(null);

  const generateImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = 600, h = 315;
    canvas.width = w;
    canvas.height = h;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#181f2c');
    grad.addColorStop(1, '#1e2738');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Border
    ctx.strokeStyle = 'rgba(163,192,148,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    // Logo text
    ctx.font = '600 18px "Space Grotesk", serif';
    ctx.fillStyle = '#e4ede0';
    ctx.fillText('A', 24, 36);
    ctx.fillStyle = '#a3c094';
    ctx.fillText('*', 38, 34);
    ctx.fillStyle = '#e4ede0';
    ctx.fillText(' Arena', 46, 36);

    // Date
    ctx.font = '400 10px "Space Grotesk", sans-serif';
    ctx.fillStyle = 'rgba(228,237,224,0.35)';
    ctx.textAlign = 'right';
    ctx.fillText(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), w - 24, 34);
    ctx.textAlign = 'left';

    // Divider
    ctx.strokeStyle = 'rgba(163,192,148,0.15)';
    ctx.beginPath();
    ctx.moveTo(24, 52);
    ctx.lineTo(w - 24, 52);
    ctx.stroke();

    // Boss name + topic
    ctx.font = '500 24px "Space Grotesk", serif';
    ctx.fillStyle = '#e4ede0';
    ctx.fillText(`${bossEmoji || '\u2694\uFE0F'} ${bossName || 'Boss'}`, 24, 86);

    ctx.font = '400 12px "Space Grotesk", sans-serif';
    ctx.fillStyle = 'rgba(228,237,224,0.45)';
    ctx.fillText(topicName || '', 24, 106);

    // Victory/Defeat badge
    const badgeText = isVictory ? '\uD83C\uDFC6 VICTORY' : '\uD83D\uDC80 DEFEAT';
    const badgeColour = isVictory ? '#a3c094' : '#c4856a';
    ctx.font = '500 11px "Space Grotesk", sans-serif';
    ctx.fillStyle = badgeColour;
    ctx.textAlign = 'right';
    ctx.fillText(badgeText, w - 24, 86);
    ctx.textAlign = 'left';

    // Phase scores
    const phases = [
      { name: 'RECALL', score: results?.recallScore || 0, max: results?.recallMax || 10, colour: '#a3c094' },
      { name: 'APPLICATION', score: results?.appScore || 0, max: results?.appMax || 12, colour: '#9bb8c4' },
      { name: 'EXTENDED', score: results?.extScore || 0, max: results?.extMax || 6, colour: '#d4b896' },
    ];

    phases.forEach((p, i) => {
      const y = 140 + i * 42;
      const pct = p.max > 0 ? p.score / p.max : 0;
      const barW = 360;

      // Label
      ctx.font = '500 9px "Space Grotesk", sans-serif';
      ctx.fillStyle = 'rgba(228,237,224,0.35)';
      ctx.fillText(p.name, 24, y);

      // Bar background
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      if (ctx.roundRect) { ctx.roundRect(24, y + 6, barW, 10, 5); } else { ctx.rect(24, y + 6, barW, 10); }
      ctx.fill();

      // Bar fill
      ctx.fillStyle = p.colour;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      const fillW = barW * pct;
      if (ctx.roundRect && fillW > 0) { ctx.roundRect(24, y + 6, fillW, 10, 5); } else if (fillW > 0) { ctx.rect(24, y + 6, fillW, 10); }
      ctx.fill();
      ctx.globalAlpha = 1;

      // Score text
      ctx.font = '500 12px "Space Grotesk", serif';
      ctx.fillStyle = p.colour;
      ctx.fillText(`${p.score}/${p.max}`, barW + 36, y + 14);

      // Percentage
      ctx.font = '400 10px "Space Grotesk", sans-serif';
      ctx.fillStyle = 'rgba(228,237,224,0.35)';
      ctx.fillText(`${Math.round(pct * 100)}%`, barW + 80, y + 14);
    });

    // Bottom stats
    const y = 280;
    ctx.strokeStyle = 'rgba(163,192,148,0.15)';
    ctx.beginPath();
    ctx.moveTo(24, y - 12);
    ctx.lineTo(w - 24, y - 12);
    ctx.stroke();

    const stats = [
      { label: 'XP EARNED', value: `+${results?.xpEarned || 0}`, colour: '#a3c094' },
      { label: 'MASTERY', value: `${Math.round((results?.masteryAfter || 0) * 100)}%`, colour: '#d4b896' },
      { label: 'TIME', value: results?.duration || '0:00', colour: '#9bb8c4' },
    ];

    stats.forEach((s, i) => {
      const x = 24 + i * 190;
      ctx.font = '500 9px "Space Grotesk", sans-serif';
      ctx.fillStyle = 'rgba(228,237,224,0.3)';
      ctx.fillText(s.label, x, y);
      ctx.font = '600 16px "Space Grotesk", serif';
      ctx.fillStyle = s.colour;
      ctx.fillText(s.value, x, y + 20);
    });

    // Download
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);

      // Try Web Share API first (mobile)
      if (navigator.share && navigator.canShare?.({ files: [new File([blob], 'battle-report.png', { type: 'image/png' })] })) {
        navigator.share({
          files: [new File([blob], 'astar-arena-battle-report.png', { type: 'image/png' })],
          title: 'A* Arena Battle Report',
        }).catch(() => {
          // Fallback to download
          triggerDownload(url);
        });
      } else {
        triggerDownload(url);
      }
    }, 'image/png', 1.0);
  }, [results, bossName, bossEmoji, topicName, isVictory]);

  function triggerDownload(url) {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'astar-arena-battle-report.png';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      <button
        onClick={generateImage}
        className="text-button bg-bg-tertiary text-text-secondary hover:text-text-primary px-4 py-2.5 rounded-lg cursor-pointer border border-border transition-colors"
      >
        Share Result
      </button>
    </>
  );
}
