import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchMovie } from '../api/movies';
import { fetchShowtimes } from '../api/showtimes';
import { resolvePosterUrl } from '../components/MovieCard';
import Badge from '../components/Badge';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';

function nextDays(count) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

function toDateKey(d) {
  return d.toISOString().slice(0, 10);
}

export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));
  const [showtimes, setShowtimes] = useState([]);
  const [showtimesLoading, setShowtimesLoading] = useState(false);

  const days = useMemo(() => nextDays(7), []);

  useEffect(() => {
    setLoading(true);
    fetchMovie(id)
      .then(setMovie)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    setShowtimesLoading(true);
    fetchShowtimes({ date: selectedDate, movieId: id })
      .then(setShowtimes)
      .catch((err) => setError(err.message))
      .finally(() => setShowtimesLoading(false));
  }, [id, selectedDate]);

  if (loading) return <Loader label="Loading movie" />;
  if (error) return <p className="px-6 py-20 text-center text-red-300">{error}</p>;
  if (!movie) return null;

  return (
    <div className="px-6 pb-24 pt-28 md:px-12">
      <div className="flex flex-col gap-8 md:flex-row">
        <img
          src={resolvePosterUrl(movie.poster_url)}
          alt={`${movie.title} poster`}
          className="w-full max-w-xs self-start rounded-lg shadow-2xl md:w-72"
        />

        <div className="flex-1">
          <h1 className="font-display text-4xl text-white md:text-5xl">{movie.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge>{movie.rating}</Badge>
            <Badge>{movie.duration_minutes} min</Badge>
            {movie.genres?.map((g) => (
              <Badge key={g.id} variant="gold">
                {g.name}
              </Badge>
            ))}
          </div>
          <p className="mt-5 max-w-2xl leading-relaxed text-ink-dim">{movie.description}</p>

          <div className="mt-10">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest2 text-ink-faint">
              Select a date
            </h2>
            <div className="row-scroll">
              {days.map((d) => {
                const key = toDateKey(d);
                const isSelected = key === selectedDate;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDate(key)}
                    className={`flex w-16 flex-col items-center rounded-lg border px-2 py-2.5 transition ${
                      isSelected
                        ? 'border-accent bg-accent text-white'
                        : 'border-line bg-surface text-ink-dim hover:border-ink-dim'
                    }`}
                  >
                    <span className="text-xs uppercase">{d.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                    <span className="text-lg font-semibold">{d.getDate()}</span>
                  </button>
                );
              })}
            </div>

            <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-widest2 text-ink-faint">
              Showtimes
            </h2>
            {showtimesLoading ? (
              <Loader label="Loading showtimes" />
            ) : showtimes.length === 0 ? (
              <EmptyState
                title="No showtimes on this date"
                description="Pick a different date to see available screenings."
              />
            ) : (
              <div className="flex flex-wrap gap-3">
                {showtimes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => navigate(`/booking/${s.id}`)}
                    className="flex flex-col items-start rounded-lg border border-line bg-surface px-4 py-3 text-left transition hover:border-gold hover:bg-surface2"
                  >
                    <span className="font-mono text-base text-white">
                      {new Date(s.start_time).toLocaleTimeString(undefined, {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="text-xs text-ink-faint">{s.room_name}</span>
                    <span className="mt-1 font-mono text-xs text-gold-soft">
                      from ${Number(s.base_price).toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
