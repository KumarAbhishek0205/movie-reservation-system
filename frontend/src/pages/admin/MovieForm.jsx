import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchMovie, createMovie, updateMovie, uploadMoviePoster, fetchGenres } from '../../api/movies';
import Loader from '../../components/Loader';

const RATINGS = ['G', 'PG', 'PG-13', 'R', 'NC-17', 'NR'];

export default function MovieForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [genres, setGenres] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    duration_minutes: 100,
    rating: 'PG-13',
    poster_url: '',
    genreIds: [],
  });
  const [posterFile, setPosterFile] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGenres().then(setGenres);
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    fetchMovie(id)
      .then((m) =>
        setForm({
          title: m.title,
          description: m.description,
          duration_minutes: m.duration_minutes,
          rating: m.rating,
          poster_url: m.poster_url || '',
          genreIds: m.genres.map((g) => g.id),
        })
      )
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const toggleGenre = (genreId) => {
    setForm((f) => ({
      ...f,
      genreIds: f.genreIds.includes(genreId)
        ? f.genreIds.filter((g) => g !== genreId)
        : [...f.genreIds, genreId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, duration_minutes: Number(form.duration_minutes) };
      const movie = isEdit ? await updateMovie(id, payload) : await createMovie(payload);
      if (posterFile) {
        await uploadMoviePoster(movie.id, posterFile);
      }
      navigate('/admin/movies');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading movie" />;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-display text-3xl text-white">{isEdit ? 'Edit Movie' : 'Add Movie'}</h1>
      {error && <p className="mb-4 text-sm text-red-300">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <TextField label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
        <TextArea
          label="Description"
          value={form.description}
          onChange={(v) => setForm({ ...form, description: v })}
        />

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Duration (minutes)"
            type="number"
            min="1"
            value={form.duration_minutes}
            onChange={(v) => setForm({ ...form, duration_minutes: v })}
            required
          />
          <label className="flex flex-col gap-1.5 text-sm text-ink-dim">
            Rating
            <select
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: e.target.value })}
              className="rounded border border-line bg-surface2 px-3 py-2.5 text-white outline-none focus:border-gold"
            >
              {RATINGS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        </div>

        <TextField
          label="Poster image URL (optional if uploading a file below)"
          value={form.poster_url}
          onChange={(v) => setForm({ ...form, poster_url: v })}
          placeholder="https://…"
        />

        <label className="flex flex-col gap-1.5 text-sm text-ink-dim">
          Upload poster image
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
            className="rounded border border-line bg-surface2 px-3 py-2.5 text-white file:mr-3 file:rounded file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-white"
          />
        </label>

        <div>
          <p className="mb-2 text-sm text-ink-dim">Genres</p>
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => {
              const active = form.genreIds.includes(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGenre(g.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    active ? 'border-accent bg-accent text-white' : 'border-line text-ink-dim hover:border-ink-dim'
                  }`}
                >
                  {g.name}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-2 w-fit rounded bg-accent px-6 py-2.5 font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create movie'}
        </button>
      </form>
    </div>
  );
}

function TextField({ label, value, onChange, ...rest }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-ink-dim">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border border-line bg-surface2 px-3 py-2.5 text-white outline-none focus:border-gold"
        {...rest}
      />
    </label>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-ink-dim">
      {label}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="rounded border border-line bg-surface2 px-3 py-2.5 text-white outline-none focus:border-gold"
      />
    </label>
  );
}
