import { useEffect, useState } from 'react';
import { fetchAllReservations } from '../../api/admin';
import Loader from '../../components/Loader';
import Badge from '../../components/Badge';

export default function AllReservations() {
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('');
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (date) params.date = date;
    if (status) params.status = status;
    fetchAllReservations(params)
      .then(setReservations)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [date, status]);

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl text-white">All Reservations</h1>

      <div className="mb-5 flex flex-wrap gap-4">
        <label className="flex flex-col gap-1.5 text-xs text-ink-dim">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded border border-line bg-surface2 px-3 py-2 text-white outline-none focus:border-gold"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-ink-dim">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded border border-line bg-surface2 px-3 py-2 text-white outline-none focus:border-gold"
          >
            <option value="">All</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
      </div>

      {error && <p className="mb-4 text-sm text-red-300">{error}</p>}

      {loading ? (
        <Loader label="Loading reservations" />
      ) : reservations.length === 0 ? (
        <p className="text-sm text-ink-faint">No reservations match these filters.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-ink-faint">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Movie</th>
                <th className="px-4 py-3">Showtime</th>
                <th className="px-4 py-3">Seats</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id} className="border-t border-line bg-surface/40">
                  <td className="px-4 py-3">
                    <p className="text-white">{r.user_name}</p>
                    <p className="text-xs text-ink-faint">{r.user_email}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-dim">{r.movie_title}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-dim">
                    {new Date(r.start_time).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}{' '}
                    · {r.room_name}
                  </td>
                  <td className="px-4 py-3 text-ink-dim">{r.seat_count}</td>
                  <td className="px-4 py-3 font-mono text-gold-soft">${Number(r.total_price).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={r.status === 'confirmed' ? 'success' : 'default'}>{r.status}</Badge>
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
