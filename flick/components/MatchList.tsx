'use client';

import Image from 'next/image';
import { getTMDBImageUrl } from '@/lib/utils';

interface Match {
  tmdbId: number;
  title: string | null;
  posterPath: string | null;
  overview?: string | null;
}

interface MatchListProps {
  matches: Match[];
  isLoading: boolean;
  onWatch?: (tmdbId: number) => void;
}

export function MatchList({ matches, isLoading, onWatch }: MatchListProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (matches.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h3 className="text-lg font-semibold text-white mb-2">No matches yet</h3>
        <p className="text-zinc-400">
          Keep swiping to find movies you both want to watch!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-400">
        {matches.length} {matches.length === 1 ? 'movie' : 'movies'} you both want to watch
      </p>
      {matches.map((match) => (
        <div
          key={match.tmdbId}
          className="flex items-start gap-4 p-4 bg-zinc-900/50 rounded-2xl"
        >
          {/* Poster */}
          <div className="shrink-0 w-16 h-24 rounded-xl overflow-hidden bg-zinc-800">
            {match.posterPath ? (
              <Image
                src={getTMDBImageUrl(match.posterPath, 'w185')}
                alt={match.title || ''}
                width={64}
                height={96}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">
                🎬
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white">
              {match.title || 'Unknown Movie'}
            </h3>
            {match.overview && (
              <p className="text-zinc-400 text-sm mt-1 line-clamp-2">
                {match.overview}
              </p>
            )}
            {onWatch && (
              <button
                onClick={() => onWatch(match.tmdbId)}
                className="mt-3 px-4 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors"
              >
                Mark as watched
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse flex items-start gap-4 p-4 bg-zinc-900/50 rounded-2xl">
          <div className="w-16 h-24 rounded-xl bg-zinc-800" />
          <div className="flex-1">
            <div className="h-5 bg-zinc-800 rounded w-3/4 mb-2" />
            <div className="h-4 bg-zinc-800 rounded w-full mb-1" />
            <div className="h-4 bg-zinc-800 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
