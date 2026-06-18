function groupByRow(seats) {
  const rows = {};
  for (const seat of seats) {
    rows[seat.row_label] = rows[seat.row_label] || [];
    rows[seat.row_label].push(seat);
  }
  return Object.entries(rows).sort(([a], [b]) => a.localeCompare(b));
}

function seatClasses(seat, isSelected) {
  if (seat.is_booked) {
    return 'bg-surface2 text-ink-faint/40 border-line cursor-not-allowed';
  }
  if (isSelected) {
    return 'bg-accent text-white border-accent shadow-glow';
  }
  if (seat.seat_type === 'premium') {
    return 'bg-surface text-gold-soft border-gold/50 hover:border-gold hover:bg-gold-muted';
  }
  return 'bg-surface text-ink-dim border-line hover:border-ink-dim hover:text-white';
}

export default function SeatMap({ seats, selectedSeatIds, onToggleSeat }) {
  const rows = groupByRow(seats);

  return (
    <div className="select-none">
      <div className="mx-auto mb-10 h-2 max-w-md rounded-full bg-gradient-to-r from-transparent via-gold/60 to-transparent shadow-goldGlow" />
      <p className="mb-8 text-center text-xs uppercase tracking-widest2 text-ink-faint">Screen</p>

      <div className="flex flex-col items-center gap-2 overflow-x-auto pb-2">
        {rows.map(([rowLabel, rowSeats]) => (
          <div key={rowLabel} className="flex items-center gap-2">
            <span className="w-4 font-mono text-xs text-ink-faint">{rowLabel}</span>
            <div className="flex gap-1.5">
              {rowSeats
                .sort((a, b) => a.seat_number - b.seat_number)
                .map((seat) => {
                  const isSelected = selectedSeatIds.includes(seat.id);
                  return (
                    <button
                      key={seat.id}
                      type="button"
                      disabled={seat.is_booked}
                      onClick={() => onToggleSeat(seat)}
                      aria-label={`Seat ${rowLabel}${seat.seat_number}${seat.seat_type === 'premium' ? ', premium' : ''}${seat.is_booked ? ', already booked' : isSelected ? ', selected' : ', available'}`}
                      aria-pressed={isSelected}
                      className={`flex h-7 w-7 items-center justify-center rounded-t-md border font-mono text-[10px] transition ${seatClasses(seat, isSelected)}`}
                    >
                      {seat.seat_number}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-xs text-ink-dim">
        <LegendSwatch className="border-line bg-surface" label="Standard" />
        <LegendSwatch className="border-gold/50 bg-surface" label="Premium" />
        <LegendSwatch className="border-accent bg-accent" label="Selected" />
        <LegendSwatch className="border-line bg-surface2" label="Booked" faded />
      </div>
    </div>
  );
}

function LegendSwatch({ className, label, faded }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-4 w-4 rounded-sm border ${className} ${faded ? 'opacity-50' : ''}`} />
      <span>{label}</span>
    </div>
  );
}
