import { resolvePosterUrl } from './MovieCard';
import Badge from './Badge';

function formatDateTime(iso) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
    time: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
  };
}

export default function TicketStub({ reservation, onCancel, cancelling }) {
  const { date, time } = formatDateTime(reservation.start_time);
  const isPast = new Date(reservation.start_time).getTime() < Date.now();
  const canCancel = reservation.status === 'confirmed' && !isPast;
  const seatLabel = reservation.seats
    .map((s) => `${s.row_label}${s.seat_number}`)
    .join(', ');

  return (
    <div className="flex overflow-hidden rounded-lg border border-line bg-surface shadow-lg">
      <div className="hidden w-28 shrink-0 sm:block">
        <img
          src={resolvePosterUrl(reservation.poster_url)}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>

      <div className="ticket-perforation flex flex-1 flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h3 className="font-semibold text-white">{reservation.movie_title}</h3>
            <Badge variant={reservation.status === 'cancelled' ? 'default' : isPast ? 'default' : 'success'}>
              {reservation.status === 'cancelled' ? 'Cancelled' : isPast ? 'Watched' : 'Upcoming'}
            </Badge>
          </div>
          <p className="text-sm text-ink-dim">
            {date} · {time} · {reservation.room_name}
          </p>
          <p className="mt-1 font-mono text-xs text-ink-faint">Seats {seatLabel}</p>
        </div>

        <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
          <p className="font-mono text-lg text-gold-soft">${Number(reservation.total_price).toFixed(2)}</p>
          {canCancel && (
            <button
              type="button"
              onClick={() => onCancel(reservation.id)}
              disabled={cancelling}
              className="rounded border border-line px-3 py-1.5 text-xs font-semibold text-ink-dim transition hover:border-accent hover:text-accent disabled:opacity-50"
            >
              {cancelling ? 'Cancelling…' : 'Cancel reservation'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
