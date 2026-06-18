import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMovies, deleteMovie } from '../../api/movies';
import { resolvePosterUrl } from '../../components/MovieCard';
import Loader from '../../components/Loader';
import Badge from '../../components/Badge';

export default function Movies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    fetchMovies()
      .then(setMovies)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this movie? This cannot be undone.')) return;
    try {
      await deleteMovie(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Loader label="Loading movies" />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl text-white">Movies</h1>
        <Link
          to="/admin/movies/new"
          className="rounded bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
        >
          + Add Movie
        </Link>
      </div>

      {error && <p className="mb-4 text-sm text-red-300">{error}</p>}

      <div className="overflow-hidden rounded-lg border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-ink-faint">
            <tr>
              <th className="px-4 py-3">Poster</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Genres</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {movies.map((m) => (
              <tr key={m.id} className="border-t border-line bg-surface/40">
                <td className="px-4 py-3">
                  <img src={resolvePosterUrl(m.poster_url)} alt="" className="h-14 w-10 rounded object-cover" />
                </td>
                <td className="px-4 py-3 font-medium text-white">{m.title}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {m.genres?.map((g) => (
                      <Badge key={g.id}>{g.name}</Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-dim">{m.duration_minutes} min</td>
                <td className="px-4 py-3 text-ink-dim">{m.rating}</td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/admin/movies/${m.id}/edit`} className="mr-3 text-gold-soft hover:underline">
                    Edit
                  </Link>
                  <button type="button" onClick={() => handleDelete(m.id)} className="text-accent hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
