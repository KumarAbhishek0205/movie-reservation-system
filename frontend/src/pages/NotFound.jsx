import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-6xl text-accent">404</h1>
      <p className="text-ink-dim">This page took an intermission and never came back.</p>
      <Link to="/" className="rounded bg-accent px-5 py-2 font-semibold text-white hover:bg-accent-hover">
        Back to browsing
      </Link>
    </div>
  );
}
