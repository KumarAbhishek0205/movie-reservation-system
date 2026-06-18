import { Link } from 'react-router-dom';
import Badge from './Badge';
import { resolvePosterUrl } from './MovieCard';

export default function Hero({ movie }) {
  if (!movie) return null;

  return (
    <section className="relative h-[78vh] min-h-[480px] w-full overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={resolvePosterUrl(movie.poster_url)}
          alt=""
          aria-hidden="true"
          className="h-full w-full scale-110 object-cover opacity-40 blur-sm"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/40 to-canvas/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-canvas via-canvas/30 to-transparent" />
      </div>

      <div className="relative z-10 flex h-full flex-col justify-end gap-4 px-6 pb-16 md:px-12 md:pb-24">
        <Badge variant="gold" className="w-fit uppercase tracking-widest2">
          Now Showing
        </Badge>
        <h1 className="max-w-2xl font-display text-4xl leading-[0.95] text-white drop-shadow-lg md:text-6xl">
          {movie.title}
        </h1>
        <div className="flex items-center gap-2 text-sm text-ink-dim">
          <span>{movie.rating}</span>
          <span>·</span>
          <span>{movie.duration_minutes} min</span>
          {movie.genres?.length > 0 && (
            <>
              <span>·</span>
              <span>{movie.genres.map((g) => g.name).join(', ')}</span>
            </>
          )}
        </div>
        <p className="max-w-xl text-sm text-ink-dim md:text-base">{movie.description}</p>
        <div className="mt-2 flex gap-3">
          <Link
            to={`/movies/${movie.id}`}
            className="rounded bg-accent px-6 py-2.5 font-semibold text-white transition hover:bg-accent-hover"
          >
            Reserve Tickets
          </Link>
          <Link
            to={`/movies/${movie.id}`}
            className="rounded border border-line bg-surface/60 px-6 py-2.5 font-semibold text-white transition hover:border-ink-dim"
          >
            More Info
          </Link>
        </div>
      </div>
    </section>
  );
}
