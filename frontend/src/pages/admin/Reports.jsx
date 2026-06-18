import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchRevenueReport, fetchCapacityReport } from '../../api/admin';
import Loader from '../../components/Loader';

export default function Reports() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [groupBy, setGroupBy] = useState('day');
  const [revenueRows, setRevenueRows] = useState([]);
  const [capacityRows, setCapacityRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;

    Promise.all([fetchRevenueReport({ ...params, groupBy }), fetchCapacityReport(params)])
      .then(([revenue, capacity]) => {
        setRevenueRows(revenue.rows);
        setCapacityRows(capacity);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [from, to, groupBy]);

  const chartData = revenueRows.map((row) => ({
    label: groupBy === 'movie' ? row.movie_title : new Date(row.day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    revenue: row.revenue,
  }));

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl text-white">Reports</h1>

      <div className="mb-6 flex flex-wrap gap-4">
        <label className="flex flex-col gap-1.5 text-xs text-ink-dim">
          From
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded border border-line bg-surface2 px-3 py-2 text-white outline-none focus:border-gold"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-ink-dim">
          To
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded border border-line bg-surface2 px-3 py-2 text-white outline-none focus:border-gold"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-ink-dim">
          Group by
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="rounded border border-line bg-surface2 px-3 py-2 text-white outline-none focus:border-gold"
          >
            <option value="day">Day</option>
            <option value="movie">Movie</option>
          </select>
        </label>
      </div>

      {error && <p className="mb-4 text-sm text-red-300">{error}</p>}

      {loading ? (
        <Loader label="Crunching the numbers" />
      ) : (
        <>
          <div className="mb-8 rounded-lg border border-line bg-surface p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest2 text-ink-faint">
              Revenue by {groupBy}
            </h2>
            {chartData.length === 0 ? (
              <p className="text-sm text-ink-faint">No data for this range.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="label" stroke="#6f6f6f" fontSize={12} />
                  <YAxis stroke="#6f6f6f" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: '#161616', border: '1px solid #2a2a2a', color: '#fff' }}
                    formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#e50914" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="rounded-lg border border-line">
            <h2 className="px-5 py-4 text-sm font-semibold uppercase tracking-widest2 text-ink-faint">
              Capacity &amp; occupancy
            </h2>
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-ink-faint">
                <tr>
                  <th className="px-4 py-3">Showtime</th>
                  <th className="px-4 py-3">Room</th>
                  <th className="px-4 py-3">Seats sold</th>
                  <th className="px-4 py-3">Capacity</th>
                  <th className="px-4 py-3">Occupancy</th>
                </tr>
              </thead>
              <tbody>
                {capacityRows.map((row) => (
                  <tr key={row.showtime_id} className="border-t border-line bg-surface/40">
                    <td className="px-4 py-3 text-white">
                      {row.movie_title}
                      <span className="ml-2 font-mono text-xs text-ink-faint">
                        {new Date(row.start_time).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-dim">{row.room_name}</td>
                    <td className="px-4 py-3 text-ink-dim">{row.seats_sold}</td>
                    <td className="px-4 py-3 text-ink-dim">{row.capacity}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-surface2">
                          <div
                            className="h-full bg-gold"
                            style={{ width: `${Math.min(100, row.occupancy_rate)}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs text-gold-soft">{row.occupancy_rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
