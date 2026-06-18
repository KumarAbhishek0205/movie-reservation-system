import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchOverview, fetchRevenueReport } from '../../api/admin';
import Loader from '../../components/Loader';

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <p className="text-xs uppercase tracking-widest2 text-ink-faint">{label}</p>
      <p className={`mt-2 font-display text-3xl ${accent ? 'text-gold-soft' : 'text-white'}`}>{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([fetchOverview(), fetchRevenueReport({ groupBy: 'day' })])
      .then(([o, r]) => {
        setOverview(o);
        setRevenue(
          r.rows.map((row) => ({
            day: new Date(row.day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            revenue: row.revenue,
          }))
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading dashboard" />;
  if (error) return <p className="text-red-300">{error}</p>;

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl text-white">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Revenue" value={`$${overview.totalRevenue.toFixed(0)}`} accent />
        <StatCard label="Reservations" value={overview.totalReservations} />
        <StatCard label="Seats Sold" value={overview.seatsSold} />
        <StatCard label="Upcoming Showtimes" value={overview.upcomingShowtimes} />
        <StatCard label="Movies" value={overview.totalMovies} />
        <StatCard label="Users" value={overview.totalUsers} />
      </div>

      <div className="mt-8 rounded-lg border border-line bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest2 text-ink-faint">
          Revenue over time
        </h2>
        {revenue.length === 0 ? (
          <p className="text-sm text-ink-faint">No confirmed reservations yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="day" stroke="#6f6f6f" fontSize={12} />
              <YAxis stroke="#6f6f6f" fontSize={12} />
              <Tooltip
                contentStyle={{ background: '#161616', border: '1px solid #2a2a2a', color: '#fff' }}
                formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
              />
              <Line type="monotone" dataKey="revenue" stroke="#e50914" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
