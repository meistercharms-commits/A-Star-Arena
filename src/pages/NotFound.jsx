import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <span className="text-6xl mb-4">🧬</span>
      <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
      <p className="text-text-secondary mb-4">
        This page doesn't exist. Maybe it mutated.
      </p>
      <Link
        to="/"
        className="bg-accent hover:bg-accent-hover text-bg-primary font-semibold py-2 px-4 rounded-lg transition-colors no-underline"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
