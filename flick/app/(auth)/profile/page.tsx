'use client';

import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { MovieList } from '@/components/MovieCard';
import { useWantToWatch } from '@/hooks/useSwipe';
import { useWatchHistory } from '@/hooks/useMatches';
import { getInitials } from '@/lib/utils';

export default function ProfilePage() {
  const { data: session } = useSession();
  const { data: wantToWatch, isLoading: isLoadingQueue } = useWantToWatch();
  const { data: watchHistory, isLoading: isLoadingHistory } = useWatchHistory();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800/50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Profile</h1>
          <button
            onClick={handleSignOut}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-20 pb-24 px-4">
        <div className="max-w-lg mx-auto">
          {/* User info */}
          <div className="flex items-center gap-4 mb-8">
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || 'Profile'}
                width={64}
                height={64}
                className="rounded-full"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-xl">
                {getInitials(session?.user?.name)}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-white">
                {session?.user?.name || 'Movie Lover'}
              </h2>
              <p className="text-zinc-400">
                {session?.user?.email || 'Flick member'}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-zinc-900/50 rounded-2xl text-center">
              <div className="text-3xl font-bold text-emerald-400">
                {wantToWatch?.length || 0}
              </div>
              <p className="text-zinc-400 text-sm">Want to Watch</p>
            </div>
            <div className="p-4 bg-zinc-900/50 rounded-2xl text-center">
              <div className="text-3xl font-bold text-violet-400">
                {watchHistory?.length || 0}
              </div>
              <p className="text-zinc-400 text-sm">Watched</p>
            </div>
          </div>

          {/* Want to watch queue */}
          <section className="mb-8">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
              Want to Watch
            </h3>
            {isLoadingQueue ? (
              <LoadingRow />
            ) : wantToWatch && wantToWatch.length > 0 ? (
              <MovieList
                movies={wantToWatch.map((m: any) => ({
                  tmdbId: m.tmdbId,
                  title: m.title,
                  posterPath: m.posterPath,
                  releaseYear: m.releaseYear,
                }))}
                size="sm"
              />
            ) : (
              <p className="text-zinc-500 py-4">
                No movies in your queue yet. Start swiping!
              </p>
            )}
          </section>

          {/* Watch history */}
          <section>
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
              Watch History
            </h3>
            {isLoadingHistory ? (
              <LoadingRow />
            ) : watchHistory && watchHistory.length > 0 ? (
              <div className="space-y-3">
                {watchHistory.slice(0, 10).map((watch: any) => (
                  <WatchHistoryItem key={watch.id} watch={watch} />
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 py-4">
                No movies watched yet. Time to pick one!
              </p>
            )}
          </section>
        </div>
      </main>

      <Navbar />
    </div>
  );
}

function LoadingRow() {
  return (
    <div className="flex gap-3 overflow-hidden">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="w-20 h-30 rounded-xl bg-zinc-800 animate-pulse shrink-0" />
      ))}
    </div>
  );
}

function WatchHistoryItem({ watch }: { watch: any }) {
  const reactionEmojis: Record<string, string> = {
    loved: '❤️',
    good: '👍',
    meh: '😐',
    hated: '👎',
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl">
      <div className="w-10 h-14 rounded bg-zinc-800 flex items-center justify-center text-lg">
        🎬
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">
          {watch.title || 'Unknown Movie'}
        </p>
        <p className="text-zinc-500 text-sm">
          {new Date(watch.watchedAt).toLocaleDateString()}
        </p>
      </div>
      {watch.reaction && (
        <span className="text-xl">{reactionEmojis[watch.reaction]}</span>
      )}
    </div>
  );
}
