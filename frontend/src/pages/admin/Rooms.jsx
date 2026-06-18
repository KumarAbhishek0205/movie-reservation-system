import { useEffect, useState } from 'react';
import { fetchRooms, createRoom, deleteRoom } from '../../api/showtimes';
import Loader from '../../components/Loader';

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', rows: 6, seats_per_row: 8, premium_rows: 2 });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetchRooms()
      .then(setRooms)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createRoom({
        name: form.name,
        rows: Number(form.rows),
        seats_per_row: Number(form.seats_per_row),
        premium_rows: Number(form.premium_rows),
      });
      setForm({ name: '', rows: 6, seats_per_row: 8, premium_rows: 2 });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this room? It must have no scheduled showtimes.')) return;
    try {
      await deleteRoom(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl text-white">Rooms</h1>
      {error && <p className="mb-4 text-sm text-red-300">{error}</p>}

      <form onSubmit={handleCreate} className="mb-8 flex flex-wrap items-end gap-3 rounded-lg border border-line bg-surface p-4">
        <Field label="Room name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <Field
          label="Rows"
          type="number"
          min="1"
          max="26"
          value={form.rows}
          onChange={(v) => setForm({ ...form, rows: v })}
        />
        <Field
          label="Seats per row"
          type="number"
          min="1"
          value={form.seats_per_row}
          onChange={(v) => setForm({ ...form, seats_per_row: v })}
        />
        <Field
          label="Premium rows (back rows)"
          type="number"
          min="0"
          value={form.premium_rows}
          onChange={(v) => setForm({ ...form, premium_rows: v })}
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-accent px-5 py-2.5 font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {saving ? 'Creating…' : 'Create room'}
        </button>
      </form>

      {loading ? (
        <Loader label="Loading rooms" />
      ) : (
        <div className="overflow-hidden rounded-lg border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-ink-faint">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Rows</th>
                <th className="px-4 py-3">Seats / row</th>
                <th className="px-4 py-3">Total seats</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r.id} className="border-t border-line bg-surface/40">
                  <td className="px-4 py-3 font-medium text-white">{r.name}</td>
                  <td className="px-4 py-3 text-ink-dim">{r.rows}</td>
                  <td className="px-4 py-3 text-ink-dim">{r.seats_per_row}</td>
                  <td className="px-4 py-3 text-ink-dim">{r.seat_count}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => handleDelete(r.id)} className="text-accent hover:underline">
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

function Field({ label, value, onChange, ...rest }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs text-ink-dim">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-32 rounded border border-line bg-surface2 px-3 py-2 text-white outline-none focus:border-gold"
        {...rest}
      />
    </label>
  );
}
