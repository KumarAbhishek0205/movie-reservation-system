import { Link } from 'react-router-dom';

export default function MovieCard({ movie, width = 'w-44' }) {
  return (
    <Link
      to={`/movies/${movie.id}`}
      className={`group relative ${width} shrink-0 overflow-hidden rounded-md bg-surface transition-transform duration-300 hover:scale-[1.04] hover:shadow-glow`}
    >
      <div className="aspect-[2/3] w-full overflow-hidden bg-surface2">
        {movie.poster_url ? (
          <img
            src={resolvePosterUrl(movie.poster_url)}
            alt={`${movie.title} poster`}
            loading="lazy"
            className="h-full w-full object-cover transition-opacity duration-300"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-faint">
            <span className="font-display text-2xl">{movie.title?.[0]}</span>
          </div>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-fade-bottom p-3 pt-8">
        <p className="truncate text-sm font-semibold text-white">{movie.title}</p>
        <p className="mt-0.5 truncate text-xs text-ink-faint">
          {movie.genres?.map((g) => g.name).join(' · ') || movie.rating}
        </p>
      </div>
    </Link>
  );
}

export function resolvePosterUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace('/api', '');
  return `${apiBase}${url}`;
}
