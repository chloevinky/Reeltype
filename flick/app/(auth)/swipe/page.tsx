'use client';

import { useState } from 'react';
import { SwipeDeck } from '@/components/SwipeDeck';
import { Navbar } from '@/components/Navbar';
import { useSwipeFlow } from '@/hooks/useSwipe';
import type { Movie } from '@/components/SwipeCard';

export default function SwipePage() {
  const [page, setPage] = useState(1);
  const { movies, isLoading, hasMore, handleSwipe, refetch } = useSwipeFlow(page);

  const loadMore = () => {
    if (hasMore) {
      setPage((p) => p + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800/50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🎬</span>
            <span>Flick</span>
          </h1>
          <button
            onClick={() => refetch()}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-20 pb-32 px-4">
        <div className="max-w-lg mx-auto">
          {isLoading && movies.length === 0 ? (
            <LoadingSkeleton />
          ) : (
            <SwipeDeck
              movies={movies}
              onSwipe={handleSwipe}
              onEmpty={loadMore}
            />
          )}

          {/* Tips */}
          <div className="mt-24 text-center">
            <p className="text-zinc-500 text-sm">
              Swipe right to add to your list • Swipe left to pass
            </p>
          </div>
        </div>
      </main>

      <Navbar />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="relative w-full max-w-[400px] aspect-[2/3] mx-auto">
      <div className="animate-pulse w-full h-full rounded-3xl bg-zinc-800">
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="h-4 bg-zinc-700 rounded w-1/4 mb-2" />
          <div className="h-8 bg-zinc-700 rounded w-3/4 mb-4" />
          <div className="h-3 bg-zinc-700 rounded w-full mb-2" />
          <div className="h-3 bg-zinc-700 rounded w-5/6" />
        </div>
      </div>
    </div>
  );
}
