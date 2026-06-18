import { useEffect, useMemo, useState } from 'react';
import { fetchMovies, fetchGenres } from '../api/movies';
import Hero from '../components/Hero';
import MovieRow from '../components/MovieRow';
import MovieCard from '../components/MovieCard';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([fetchMovies(), fetchGenres()])
      .then(([m, g]) => {
        setMovies(m);
        setGenres(g);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return movies;
    const q = search.toLowerCase();
    return movies.filter((m) => m.title.toLowerCase().includes(q));
  }, [movies, search]);

  const rowsByGenre = useMemo(() => {
    return genres
      .map((genre) => ({
        genre,
        movies: filtered.filter((m) => m.genres?.some((g) => g.id === genre.id)),
      }))
      .filter((row) => row.movies.length > 0);
  }, [genres, filtered]);

  if (loading) return <Loader label="Loading the catalog" />;
  if (error) return <p className="px-6 py-20 text-center text-red-300">{error}</p>;

  const featured = movies[0];
  const searching = search.trim().length > 0;

  return (
    <div className="pb-16">
      {!searching && <Hero movie={featured} />}

      <div className={`px-6 md:px-12 ${searching ? 'pt-28' : '-mt-16 relative z-10'}`}>
        <div className="mx-auto max-w-md">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search movies by title…"
            className="w-full rounded-full border border-line bg-surface px-5 py-2.5 text-sm text-white placeholder:text-ink-faint outline-none focus:border-gold"
          />
        </div>
      </div>

      <div className="mt-10">
        {searching ? (
          filtered.length > 0 ? (
            <section className="px-6 md:px-12">
              <h2 className="mb-3 text-lg font-semibold text-white">Search results</h2>
              <div className="flex flex-wrap gap-4">
                {filtered.map((m) => (
                  <MovieCard key={m.id} movie={m} />
                ))}
              </div>
            </section>
          ) : (
            <div className="px-6 md:px-12">
              <EmptyState title="No movies match your search" description="Try a different title." />
            </div>
          )
        ) : (
          rowsByGenre.map(({ genre, movies: genreMovies }) => (
            <MovieRow key={genre.id} title={genre.name} movies={genreMovies} />
          ))
        )}
      </div>
    </div>
  );
}
