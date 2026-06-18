import { useRef } from 'react';
import MovieCard from './MovieCard';

export default function MovieRow({ title, movies }) {
  const scrollRef = useRef(null);

  if (!movies || movies.length === 0) return null;

  const scrollBy = (amount) => {
    scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <section className="mb-10">
      <div className="mb-3 flex items-center justify-between px-6 md:px-12">
        <h2 className="text-lg font-semibold text-white md:text-xl">{title}</h2>
        <div className="hidden gap-2 md:flex">
          <button
            type="button"
            aria-label={`Scroll ${title} left`}
            onClick={() => scrollBy(-600)}
            className="rounded-full border border-line p-1.5 text-ink-dim hover:border-ink-dim hover:text-white"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label={`Scroll ${title} right`}
            onClick={() => scrollBy(600)}
            className="rounded-full border border-line p-1.5 text-ink-dim hover:border-ink-dim hover:text-white"
          >
            ›
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="row-scroll px-6 md:px-12">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
}
