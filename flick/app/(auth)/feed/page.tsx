'use client';

import { Navbar } from '@/components/Navbar';
import { FeedItem } from '@/components/FeedItem';
import { useFeed } from '@/hooks/useMatches';

export default function FeedPage() {
  const { data: feed, isLoading } = useFeed();

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800/50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
          <h1 className="text-xl font-bold text-white">Activity</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-20 pb-24 px-4">
        <div className="max-w-lg mx-auto space-y-3">
          {isLoading ? (
            <LoadingSkeleton />
          ) : feed && feed.length > 0 ? (
            feed.map((item: any) => (
              <FeedItem
                key={item.id}
                type={item.type}
                user={item.user}
                movie={item.movie}
                createdAt={item.createdAt}
                reaction={item.reaction}
              />
            ))
          ) : (
            <EmptyState />
          )}
        </div>
      </main>

      <Navbar />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="animate-pulse flex items-start gap-4 p-4 bg-zinc-900/50 rounded-2xl"
        >
          <div className="w-11 h-11 rounded-full bg-zinc-800" />
          <div className="flex-1">
            <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2" />
            <div className="h-5 bg-zinc-800 rounded w-1/2 mb-2" />
            <div className="h-3 bg-zinc-800 rounded w-1/4" />
          </div>
          <div className="w-14 h-20 rounded-lg bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-12 text-center">
      <div className="text-5xl mb-4">📰</div>
      <h3 className="text-lg font-semibold text-white mb-2">No activity yet</h3>
      <p className="text-zinc-400">
        When your friends swipe or watch movies, you'll see their activity here.
      </p>
    </div>
  );
}
