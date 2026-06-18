import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchShowtimes, deleteShowtime } from '../../api/showtimes';
import Loader from '../../components/Loader';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function Showtimes() {
  const [date, setDate] = useState(todayKey());
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    fetchShowtimes({ date })
      .then(setShowtimes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [date]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this showtime?')) return;
    try {
      await deleteShowtime(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-white">Showtimes</h1>
        <button
          type="button"
          onClick={() => navigate('/admin/showtimes/new')}
          className="rounded bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
        >
          + Schedule Showtime
        </button>
      </div>

      <label className="mb-5 flex w-fit flex-col gap-1.5 text-xs text-ink-dim">
        Date
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded border border-line bg-surface2 px-3 py-2 text-white outline-none focus:border-gold"
        />
      </label>

      {error && <p className="mb-4 text-sm text-red-300">{error}</p>}

      {loading ? (
        <Loader label="Loading showtimes" />
      ) : showtimes.length === 0 ? (
        <p className="text-sm text-ink-faint">No showtimes scheduled for this date.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-ink-faint">
              <tr>
                <th className="px-4 py-3">Movie</th>
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3">Start</th>
                <th className="px-4 py-3">End</th>
                <th className="px-4 py-3">Base price</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {showtimes.map((s) => (
                <tr key={s.id} className="border-t border-line bg-surface/40">
                  <td className="px-4 py-3 font-medium text-white">{s.movie_title}</td>
                  <td className="px-4 py-3 text-ink-dim">{s.room_name}</td>
                  <td className="px-4 py-3 font-mono text-ink-dim">
                    {new Date(s.start_time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 font-mono text-ink-dim">
                    {new Date(s.end_time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 font-mono text-gold-soft">${Number(s.base_price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/booking/${s.id}`} className="mr-3 text-gold-soft hover:underline">
                      View seats
                    </Link>
                    <button type="button" onClick={() => handleDelete(s.id)} className="text-accent hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
