'use client';

import Image from 'next/image';
import { getTMDBImageUrl } from '@/lib/utils';

export interface Movie {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  overview?: string;
  releaseYear?: number | null;
  voteAverage?: number;
  genres?: number[];
}

interface SwipeCardProps {
  movie: Movie;
  style?: React.CSSProperties;
}

export function SwipeCard({ movie, style }: SwipeCardProps) {
  return (
    <div
      className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden bg-zinc-900 shadow-2xl cursor-grab active:cursor-grabbing select-none"
      style={style}
    >
      {/* Poster image */}
      <div className="absolute inset-0">
        <Image
          src={getTMDBImageUrl(movie.posterPath, 'w780')}
          alt={movie.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 400px"
          priority
          draggable={false}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      </div>

      {/* Movie info */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        {movie.releaseYear && (
          <p className="text-emerald-400 text-sm font-medium mb-1">
            {movie.releaseYear}
          </p>
        )}
        <h2 className="text-2xl font-bold text-white mb-2 line-clamp-2">
          {movie.title}
        </h2>
        {movie.overview && (
          <p className="text-zinc-300 text-sm line-clamp-3">
            {movie.overview}
          </p>
        )}
        {movie.voteAverage !== undefined && movie.voteAverage > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-yellow-400">★</span>
            <span className="text-white font-medium">
              {movie.voteAverage.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Swipe indicators */}
      <div className="absolute top-6 left-6 right-6 flex justify-between pointer-events-none">
        <div className="swipe-indicator-like opacity-0 px-4 py-2 bg-emerald-500/90 rounded-lg rotate-[-15deg] border-2 border-emerald-400">
          <span className="text-white font-bold text-lg">WANT</span>
        </div>
        <div className="swipe-indicator-nope opacity-0 px-4 py-2 bg-rose-500/90 rounded-lg rotate-[15deg] border-2 border-rose-400">
          <span className="text-white font-bold text-lg">PASS</span>
        </div>
      </div>
    </div>
  );
}
