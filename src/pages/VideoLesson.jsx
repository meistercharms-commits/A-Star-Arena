import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubject } from '../contexts/SubjectContext';
import { useLevel } from '../contexts/LevelContext';
import { getExamBoard } from '../lib/storage';
import { auth, hasConfig } from '../lib/firebase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function VideoLesson() {
  const { isGuest } = useAuth();
  const { subjectId } = useSubject();
  const { level } = useLevel();
  const examBoard = getExamBoard(subjectId);

  const [url, setUrl] = useState('');
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setLesson(null);

    try {
      // Get auth headers
      let headers = { 'Content-Type': 'application/json' };
      if (hasConfig && auth?.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          headers.Authorization = `Bearer ${token}`;
        } catch {}
      }

      const res = await fetch(`${API_BASE}/api/claude/videoLesson`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          youtubeUrl: url,
          subjectId,
          level,
          examBoard,
        }),
      });

      if (res.status === 402) {
        const data = await res.json();
        setError(data.error === 'guest_limit_reached'
          ? 'Create a free account to use video lessons.'
          : 'Not enough credits. Video lessons cost 3 credits.');
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to generate lesson');
        setLoading(false);
        return;
      }

      setLesson(data.data);
    } catch (err) {
      setError('Failed to connect to the server. Please try again.');
    }

    setLoading(false);
  }

  const isValidUrl = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/.test(url) || /^[a-zA-Z0-9_-]{11}$/.test(url);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-display">Video Lesson</h1>
        <p className="text-text-secondary text-sm mt-1">
          Paste a YouTube video URL and we'll turn it into a structured revision lesson with quiz questions.
        </p>
      </div>

      {/* URL input */}
      <form onSubmit={handleGenerate} className="bg-bg-secondary border border-border rounded-xl p-5 shadow-card">
        <div className="flex gap-3">
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="input-field flex-1"
          />
          <button
            type="submit"
            disabled={loading || !isValidUrl}
            className="text-button bg-accent text-bg-primary px-5 py-2.5 rounded-lg cursor-pointer border-0 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
          >
            {loading ? 'Generating...' : 'Generate Lesson (3 credits)'}
          </button>
        </div>
        {error && <p className="text-weak text-sm mt-2">{error}</p>}
        {loading && (
          <p className="text-text-muted text-sm mt-2">
            Fetching transcript and generating questions... this may take 15-30 seconds.
          </p>
        )}
      </form>

      {/* Lesson result */}
      {lesson && (
        <div className="space-y-5 animate-slide-up">
          {/* Title and video */}
          <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-card">
            <h2 className="font-display text-title mb-3">{lesson.title}</h2>
            <div className="aspect-video rounded-lg overflow-hidden mb-4">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${lesson.videoId}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
              {lesson.summary}
            </div>
          </div>

          {/* Key terms */}
          {lesson.keyTerms?.length > 0 && (
            <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-card">
              <h3 className="text-label mb-3">Key Terms</h3>
              <div className="grid gap-2">
                {lesson.keyTerms.map((term, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="font-display font-medium text-accent shrink-0">{term.term}:</span>
                    <span className="text-text-secondary">{term.definition}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Questions preview */}
          {lesson.questions?.length > 0 && (
            <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-card">
              <h3 className="text-label mb-3">Quiz Questions ({lesson.questions.length})</h3>
              <div className="space-y-3">
                {lesson.questions.map((q, i) => (
                  <div key={q.id || i} className="border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        q.phase === 'recall' ? 'bg-accent/15 text-accent' : 'bg-developing/15 text-developing'
                      }`}>
                        {q.phase === 'recall' ? 'Recall' : 'Application'} ({q.maxScore} marks)
                      </span>
                    </div>
                    <p className="text-sm text-text-primary">{q.prompt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
