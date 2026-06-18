import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { fetchMyReservations, cancelReservation } from '../api/reservations';
import TicketStub from '../components/TicketStub';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';

export default function MyReservations() {
  const location = useLocation();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const load = () => {
    setLoading(true);
    fetchMyReservations()
      .then(setReservations)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCancel = async (id) => {
    setCancellingId(id);
    try {
      await cancelReservation(id);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  const upcoming = reservations.filter(
    (r) => r.status === 'confirmed' && new Date(r.start_time).getTime() >= Date.now()
  );
  const past = reservations.filter(
    (r) => r.status === 'cancelled' || new Date(r.start_time).getTime() < Date.now()
  );

  return (
    <div className="px-6 pb-24 pt-28 md:px-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 font-display text-3xl text-white">My Tickets</h1>
        {location.state?.justBooked && (
          <p className="mb-6 rounded border border-emerald-800 bg-emerald-950 px-4 py-3 text-sm text-emerald-300">
            Your reservation is confirmed. Enjoy the show!
          </p>
        )}
        {error && <p className="mb-6 text-sm text-red-300">{error}</p>}

        {loading ? (
          <Loader label="Loading your tickets" />
        ) : reservations.length === 0 ? (
          <EmptyState
            title="No reservations yet"
            description="Browse the catalog and pick a showtime to get started."
            action={
              <Link to="/" className="mt-2 rounded bg-accent px-5 py-2 font-semibold text-white hover:bg-accent-hover">
                Browse movies
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-10">
            {upcoming.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest2 text-ink-faint">
                  Upcoming
                </h2>
                <div className="flex flex-col gap-4">
                  {upcoming.map((r) => (
                    <TicketStub
                      key={r.id}
                      reservation={r}
                      onCancel={handleCancel}
                      cancelling={cancellingId === r.id}
                    />
                  ))}
                </div>
              </section>
            )}
            {past.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest2 text-ink-faint">
                  Past &amp; cancelled
                </h2>
                <div className="flex flex-col gap-4 opacity-70">
                  {past.map((r) => (
                    <TicketStub key={r.id} reservation={r} onCancel={handleCancel} cancelling={false} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
