import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchShowtime } from '../api/showtimes';
import { createReservation } from '../api/reservations';
import SeatMap from '../components/SeatMap';
import Loader from '../components/Loader';
import { resolvePosterUrl } from '../components/MovieCard';

const MAX_SEATS = 8;

export default function Booking() {
  const { showtimeId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState([]);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  const load = () => {
    setLoading(true);
    fetchShowtime(showtimeId)
      .then((d) => {
        setData(d);
        setSelected([]);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [showtimeId]);

  const selectedSeats = useMemo(
    () => (data ? data.seats.filter((s) => selected.includes(s.id)) : []),
    [data, selected]
  );
  const total = selectedSeats.reduce((sum, s) => sum + Number(s.price), 0);

  const toggleSeat = (seat) => {
    if (seat.is_booked) return;
    setConfirmError('');
    setSelected((prev) => {
      if (prev.includes(seat.id)) return prev.filter((id) => id !== seat.id);
      if (prev.length >= MAX_SEATS) return prev;
      return [...prev, seat.id];
    });
  };

  const handleConfirm = async () => {
    setConfirming(true);
    setConfirmError('');
    try {
      const reservation = await createReservation({
        showtime_id: Number(showtimeId),
        seat_ids: selected,
      });
      navigate('/reservations', { state: { justBooked: reservation.id } });
    } catch (err) {
      setConfirmError(err.message);
      load(); // refresh seat map in case seats were taken by someone else
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return <Loader label="Loading seat map" />;
  if (error) return <p className="px-6 py-20 text-center text-red-300">{error}</p>;
  if (!data) return null;

  const { showtime, seats } = data;

  return (
    <div className="px-6 pb-32 pt-28 md:px-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-4">
          <img
            src={resolvePosterUrl(showtime.poster_url)}
            alt=""
            className="h-24 w-16 rounded object-cover"
          />
          <div>
            <h1 className="text-xl font-semibold text-white">{showtime.movie_title}</h1>
            <p className="text-sm text-ink-dim">
              {new Date(showtime.start_time).toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}{' '}
              ·{' '}
              {new Date(showtime.start_time).toLocaleTimeString(undefined, {
                hour: 'numeric',
                minute: '2-digit',
              })}{' '}
              · {showtime.room_name}
            </p>
          </div>
        </div>

        <SeatMap seats={seats} selectedSeatIds={selected} onToggleSeat={toggleSeat} />

        <p className="mt-4 text-center text-xs text-ink-faint">
          You can select up to {MAX_SEATS} seats per reservation.
        </p>

        {confirmError && (
          <p className="mt-6 rounded border border-accent/40 bg-accent-muted/40 px-4 py-3 text-center text-sm text-red-200">
            {confirmError}
          </p>
        )}
      </div>

      {selected.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4 md:px-12">
            <div>
              <p className="font-mono text-xs text-ink-faint">
                {selected.length} seat{selected.length > 1 ? 's' : ''} selected
              </p>
              <p className="font-mono text-xl text-gold-soft">${total.toFixed(2)}</p>
            </div>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirming}
              className="rounded bg-accent px-8 py-3 font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
            >
              {confirming ? 'Confirming…' : 'Confirm Reservation'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
