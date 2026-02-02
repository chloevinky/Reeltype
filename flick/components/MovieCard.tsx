'use client';

import Image from 'next/image';
import { getTMDBImageUrl } from '@/lib/utils';

interface Movie {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseYear?: number | null;
}

interface MovieCardProps {
  movie: Movie;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function MovieCard({ movie, size = 'md', onClick }: MovieCardProps) {
  const sizeClasses = {
    sm: 'w-20 h-30',
    md: 'w-28 h-42',
    lg: 'w-36 h-54',
  };

  return (
    <button
      onClick={onClick}
      className={`${sizeClasses[size]} relative rounded-xl overflow-hidden bg-zinc-800 shrink-0 transition-transform hover:scale-105 active:scale-95`}
    >
      <Image
        src={getTMDBImageUrl(movie.posterPath, 'w185')}
        alt={movie.title}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 80px, 112px"
      />
      {movie.releaseYear && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
          <p className="text-white text-xs font-medium truncate">{movie.title}</p>
        </div>
      )}
    </button>
  );
}

interface MovieListProps {
  movies: Movie[];
  size?: 'sm' | 'md' | 'lg';
  onMovieClick?: (movie: Movie) => void;
}

export function MovieList({ movies, size = 'md', onMovieClick }: MovieListProps) {
  if (movies.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {movies.map((movie) => (
        <MovieCard
          key={movie.tmdbId}
          movie={movie}
          size={size}
          onClick={onMovieClick ? () => onMovieClick(movie) : undefined}
        />
      ))}
    </div>
  );
}
