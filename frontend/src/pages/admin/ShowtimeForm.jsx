import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMovies } from '../../api/movies';
import { fetchRooms, createShowtime } from '../../api/showtimes';

export default function ShowtimeForm() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({
    movie_id: '',
    room_id: '',
    start_date: '',
    start_time: '19:00',
    base_price: 12.5,
    premium_multiplier: 1.5,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMovies().then(setMovies);
    fetchRooms().then(setRooms);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const startDateTime = new Date(`${form.start_date}T${form.start_time}`);
      await createShowtime({
        movie_id: Number(form.movie_id),
        room_id: Number(form.room_id),
        start_time: startDateTime.toISOString(),
        base_price: Number(form.base_price),
        premium_multiplier: Number(form.premium_multiplier),
      });
      navigate('/admin/showtimes');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 font-display text-3xl text-white">Schedule Showtime</h1>
      {error && <p className="mb-4 text-sm text-red-300">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1.5 text-sm text-ink-dim">
          Movie
          <select
            required
            value={form.movie_id}
            onChange={(e) => setForm({ ...form, movie_id: e.target.value })}
            className="rounded border border-line bg-surface2 px-3 py-2.5 text-white outline-none focus:border-gold"
          >
            <option value="" disabled>
              Select a movie
            </option>
            {movies.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title} ({m.duration_minutes} min)
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-ink-dim">
          Room
          <select
            required
            value={form.room_id}
            onChange={(e) => setForm({ ...form, room_id: e.target.value })}
            className="rounded border border-line bg-surface2 px-3 py-2.5 text-white outline-none focus:border-gold"
          >
            <option value="" disabled>
              Select a room
            </option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.seat_count} seats)
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-sm text-ink-dim">
            Date
            <input
              type="date"
              required
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              className="rounded border border-line bg-surface2 px-3 py-2.5 text-white outline-none focus:border-gold"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-ink-dim">
            Time
            <input
              type="time"
              required
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              className="rounded border border-line bg-surface2 px-3 py-2.5 text-white outline-none focus:border-gold"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-sm text-ink-dim">
            Base price ($)
            <input
              type="number"
              min="0"
              step="0.5"
              required
              value={form.base_price}
              onChange={(e) => setForm({ ...form, base_price: e.target.value })}
              className="rounded border border-line bg-surface2 px-3 py-2.5 text-white outline-none focus:border-gold"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-ink-dim">
            Premium multiplier
            <input
              type="number"
              min="1"
              step="0.1"
              value={form.premium_multiplier}
              onChange={(e) => setForm({ ...form, premium_multiplier: e.target.value })}
              className="rounded border border-line bg-surface2 px-3 py-2.5 text-white outline-none focus:border-gold"
            />
          </label>
        </div>

        <p className="text-xs text-ink-faint">
          A 20-minute buffer is automatically added after the movie's runtime for trailers and cleanup. The room
          cannot be double-booked — overlapping times will be rejected.
        </p>

        <button
          type="submit"
          disabled={saving}
          className="mt-2 w-fit rounded bg-accent px-6 py-2.5 font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {saving ? 'Scheduling…' : 'Schedule showtime'}
        </button>
      </form>
    </div>
  );
}
