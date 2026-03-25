import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSubject } from '../contexts/SubjectContext';
import { generateStudyGuide } from '../lib/claudeClient';
import { calculateTopicMastery } from '../lib/mastery';
import { getRecurringMistakes } from '../lib/errorPatterns';
import { getSettings, getExamBoard, getCurrentSubject } from '../lib/storage';
import { getMasteryCategory } from '../lib/utils';

const ANSWER_TEMPLATES = [
  {
    type: 'Define',
    marks: '1-2 marks',
    when: 'When asked "State..." or "Define..."',
    structure: 'A [term] is [precise definition].\nInclude the key scientific term and one identifying detail.',
  },
  {
    type: 'Explain',
    marks: '3-4 marks',
    when: 'When asked "Explain..." or "Describe..."',
    structure: '1. State the key fact\n2. Give the reason/mechanism\n3. Link cause to effect\n4. Use correct terminology',
  },
  {
    type: 'Compare',
    marks: '4-6 marks',
    when: 'When asked "Compare..." or "Distinguish..."',
    structure: '1. Name both things being compared\n2. State similarity with evidence\n3. State difference with evidence\n4. Use comparative language (whereas, however, both)',
  },
  {
    type: 'Evaluate',
    marks: '6 marks',
    when: 'When asked "Evaluate..." or "Discuss..."',
    structure: '1. State your position clearly\n2. Give evidence FOR (with data/examples)\n3. Give evidence AGAINST\n4. Consider limitations of evidence\n5. Reach a justified conclusion',
  },
];

export default function StudyGuide() {
  const { topicId } = useParams();
  const { topics } = useSubject();
  const topic = topics.find(t => t.id === topicId);
  const settings = getSettings() || {};

  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
  const cacheKey = `astarena:studyGuide:${getCurrentSubject()}:${topicId}`;

  function fetchGuide(bypassCache = false) {
    if (!topic) return;

    setLoading(true);
    setError(null);

    // Check cache first
    if (!bypassCache) {
      try {
        const cached = JSON.parse(localStorage.getItem(cacheKey));
        if (cached && cached.cachedAt && (Date.now() - cached.cachedAt) < CACHE_MAX_AGE) {
          setGuide(cached.data);
          setSource(cached.source || 'cache');
          setLoading(false);
          return;
        }
      } catch { /* ignore corrupt cache */ }
    }

    const mastery = calculateTopicMastery(topicId, topics);
    const mistakes = getRecurringMistakes();
    const topicMistakes = mistakes.filter(m => m.topicIds.includes(topicId));

    // Identify weak subskills (mastery < 0.5)
    const weakSubskills = Object.entries(mastery.subskillMasteries || {})
      .filter(([, v]) => v < 0.5)
      .map(([id]) => {
        const sub = topic.subskills?.find(s => s.id === id);
        return sub?.name || id;
      });

    const errorPatternStrings = topicMistakes.map(m => m.keyword);

    generateStudyGuide({
      topicId,
      topicName: topic.name,
      subskills: topic.subskills?.map(s => s.name) || [],
      examBoard: getExamBoard(getCurrentSubject()),
      masteryScore: mastery.topicMastery,
      weakSubskills,
      errorPatterns: errorPatternStrings,
    }).then(result => {
      if (result.success) {
        setGuide(result.data);
        setSource(result.source);
        // Cache the result
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            data: result.data,
            source: result.source,
            cachedAt: Date.now(),
          }));
        } catch { /* storage full — ignore */ }
      } else {
        setError('Failed to generate study guide.');
      }
      setLoading(false);
    }).catch(() => {
      setError('Failed to generate study guide.');
      setLoading(false);
    });
  }

  function handleRegenerate() {
    try { localStorage.removeItem(cacheKey); } catch { /* ignore */ }
    fetchGuide(true);
  }

  useEffect(() => {
    fetchGuide();
  }, [topicId]);

  // Copy guide to clipboard as plain text
  const handleCopy = async () => {
    if (!guide) return;
    const lines = [];
    lines.push(`STUDY GUIDE: ${guide.topicName}`);
    lines.push('='.repeat(40));
    lines.push('');
    if (guide.summary) {
      lines.push(guide.summary);
      lines.push('');
    }
    if (guide.keyConceptCards?.length) {
      lines.push('KEY CONCEPTS');
      lines.push('-'.repeat(20));
      guide.keyConceptCards.forEach(c => {
        lines.push(`* ${c.title}`);
        lines.push(`  ${c.explanation}`);
        if (c.examTip) lines.push(`  Exam tip: ${c.examTip}`);
        lines.push('');
      });
    }
    if (guide.workedExamples?.length) {
      lines.push('WORKED EXAMPLES');
      lines.push('-'.repeat(20));
      guide.workedExamples.forEach((ex, i) => {
        lines.push(`Q${i + 1} (${ex.marks} marks): ${ex.question}`);
        lines.push(`Answer: ${ex.answer}`);
        lines.push('');
      });
    }
    if (guide.examTips?.length) {
      lines.push('EXAM TIPS');
      lines.push('-'.repeat(20));
      guide.examTips.forEach(t => lines.push(`- ${t}`));
      lines.push('');
    }
    if (guide.weakSpotFocus?.length) {
      lines.push('WEAK SPOT FOCUS');
      lines.push('-'.repeat(20));
      guide.weakSpotFocus.forEach(w => {
        lines.push(`* ${w.subskill}: ${w.issue}`);
        lines.push(`  Fix: ${w.howToFix}`);
        lines.push('');
      });
    }

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 2000);
    }
  };

  if (!topic) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted mb-4">Topic not found.</p>
        <Link to="/topics" className="text-accent hover:underline no-underline">Back to Topics</Link>
      </div>
    );
  }

  // Mastery for the header badge
  const mastery = calculateTopicMastery(topicId, topics);
  const cat = getMasteryCategory(mastery.topicMastery);

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Study Guide</h1>
          <p className="text-text-secondary text-sm mt-1">{topic.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-mono px-2 py-1 rounded bg-${cat.colour}/10 text-${cat.colour}`}>
            {cat.emoji} {Math.round(mastery.topicMastery * 100)}%
          </span>
          {source && (
            <span className="text-xs text-text-muted">
              {source === 'claude' ? '✨ AI Generated' : '📋 Template'}
            </span>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-3">
            <div className="animate-spin inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
            <p className="text-text-muted text-sm">Generating your personalised study guide...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-weak/5 border border-weak/30 rounded-xl p-5 text-center">
          <p className="text-weak mb-3">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs bg-accent/10 text-accent hover:bg-accent/20 px-4 py-2 rounded-lg cursor-pointer transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Guide Content */}
      {guide && !loading && (
        <>
          {/* Summary */}
          {guide.summary && (
            <div className="bg-bg-secondary border border-accent/30 rounded-xl p-5">
              <p className="text-text-secondary text-sm leading-relaxed">{guide.summary}</p>
            </div>
          )}

          {/* Key Concept Cards */}
          {guide.keyConceptCards?.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-sm text-text-secondary uppercase tracking-wide">Key Concepts</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {guide.keyConceptCards.map((card, i) => (
                  <div key={i} className="bg-bg-secondary border border-border rounded-xl p-4 space-y-2">
                    <h3 className="font-semibold text-sm">{card.title}</h3>
                    <p className="text-xs text-text-secondary leading-relaxed">{card.explanation}</p>
                    {card.examTip && (
                      <p className="text-xs text-accent bg-accent/5 rounded-lg p-2">
                        <span className="font-medium">Exam tip:</span> {card.examTip}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Worked Examples */}
          {guide.workedExamples?.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-sm text-text-secondary uppercase tracking-wide">Worked Examples</h2>
              {guide.workedExamples.map((ex, i) => (
                <div key={i} className="bg-bg-secondary border border-border rounded-xl p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium">{ex.question}</p>
                    <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded shrink-0">{ex.marks} marks</span>
                  </div>
                  <div className="bg-bg-tertiary rounded-lg p-3">
                    <p className="text-xs text-text-muted uppercase tracking-wide mb-1 font-medium">Model Answer</p>
                    <p className="text-sm text-text-secondary leading-relaxed">{ex.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Exam Tips */}
          {guide.examTips?.length > 0 && (
            <div className="bg-bg-secondary border border-accent/30 rounded-xl p-5 space-y-3">
              <h2 className="font-semibold text-sm text-accent uppercase tracking-wide">Exam Tips</h2>
              <ul className="space-y-2">
                {guide.examTips.map((tip, i) => (
                  <li key={i} className="text-sm text-text-secondary flex gap-2">
                    <span className="text-accent shrink-0">*</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* How to Structure Answers */}
          <div className="space-y-3">
            <h2 className="font-semibold text-sm text-text-secondary uppercase tracking-wide">How to Structure Answers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ANSWER_TEMPLATES.map((t, i) => (
                <div key={i} className="bg-bg-secondary border border-border rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{t.type}</h3>
                    <span className="text-xs text-text-muted font-mono">{t.marks}</span>
                  </div>
                  <p className="text-xs text-text-muted">{t.when}</p>
                  <div className="text-xs text-text-secondary bg-bg-tertiary rounded-lg p-2.5 space-y-1 whitespace-pre-line">
                    {t.structure}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weak Spot Focus */}
          {guide.weakSpotFocus?.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-sm text-developing uppercase tracking-wide">Your Weak Spots</h2>
              {guide.weakSpotFocus.map((spot, i) => (
                <div key={i} className="bg-developing/5 border border-developing/30 rounded-xl p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-developing">{spot.subskill}</h3>
                  <p className="text-xs text-text-secondary">{spot.issue}</p>
                  <p className="text-xs text-text-primary bg-bg-tertiary rounded-lg p-2">
                    <span className="font-medium text-strong">Fix:</span> {spot.howToFix}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleCopy}
              className="bg-bg-secondary border border-border hover:border-accent rounded-lg px-4 py-2.5 text-sm transition-colors cursor-pointer text-text-primary"
            >
              {copied ? '✓ Copied!' : copyFailed ? '✗ Copy failed' : '📋 Copy to Clipboard'}
            </button>
            <button
              onClick={handleRegenerate}
              className="bg-bg-secondary border border-border hover:border-accent rounded-lg px-4 py-2.5 text-sm transition-colors cursor-pointer text-text-primary"
            >
              🔄 Regenerate
            </button>
            <Link
              to={`/battle/${topicId}`}
              className="bg-accent hover:bg-accent-hover text-bg-primary font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors no-underline"
            >
              Battle this Topic
            </Link>
            <Link
              to="/topics"
              className="bg-bg-tertiary hover:bg-border text-text-secondary px-4 py-2.5 rounded-lg text-sm transition-colors no-underline"
            >
              Back to Topics
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
