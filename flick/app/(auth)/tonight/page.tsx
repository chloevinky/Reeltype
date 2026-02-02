'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { MatchList } from '@/components/MatchList';
import { useFriends } from '@/hooks/useFriends';
import { useLogWatch } from '@/hooks/useMatches';

export default function TonightPage() {
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const { data: friendships } = useFriends();
  const logWatch = useLogWatch();

  const acceptedFriends = friendships?.filter((f) => f.status === 'accepted') || [];

  const { data: matches, isLoading } = useQuery({
    queryKey: ['matches', 'friend', selectedFriendId],
    queryFn: async () => {
      if (!selectedFriendId) return [];
      const response = await fetch(`/api/friends/${selectedFriendId}/matches`);
      if (!response.ok) throw new Error('Failed to fetch matches');
      return response.json();
    },
    enabled: !!selectedFriendId,
  });

  const handleWatch = async (tmdbId: number) => {
    const companionIds = selectedFriendId ? [selectedFriendId] : [];
    await logWatch.mutateAsync({ tmdbId, companionIds });
    // Could show a success toast here
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800/50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
          <h1 className="text-xl font-bold text-white">Tonight</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-20 pb-24 px-4">
        <div className="max-w-lg mx-auto">
          {/* Intro */}
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🍿</div>
            <h2 className="text-lg font-semibold text-white mb-1">
              Pick a movie for tonight
            </h2>
            <p className="text-zinc-400 text-sm">
              Select a friend to see movies you both want to watch
            </p>
          </div>

          {/* Friend selector */}
          <div className="mb-6">
            <label className="block text-sm text-zinc-400 mb-2">
              Watch with...
            </label>
            <select
              value={selectedFriendId || ''}
              onChange={(e) => setSelectedFriendId(e.target.value || null)}
              className="w-full px-4 py-3 bg-zinc-800 text-white rounded-xl border border-zinc-700 focus:border-emerald-500 focus:outline-none appearance-none"
            >
              <option value="">Select a friend</option>
              {acceptedFriends.map((friendship) => (
                <option key={friendship.id} value={friendship.friend?.id}>
                  {friendship.friend?.name || friendship.friend?.email}
                </option>
              ))}
            </select>
          </div>

          {/* Results */}
          {selectedFriendId ? (
            <MatchList
              matches={matches || []}
              isLoading={isLoading}
              onWatch={handleWatch}
            />
          ) : (
            <div className="py-12 text-center">
              <div className="text-5xl mb-4">👆</div>
              <p className="text-zinc-500">
                Select a friend above to find matching movies
              </p>
            </div>
          )}

          {/* Quick picks section */}
          {!selectedFriendId && acceptedFriends.length === 0 && (
            <div className="mt-8 p-6 bg-zinc-900/50 rounded-2xl text-center">
              <h3 className="text-lg font-semibold text-white mb-2">
                No friends yet?
              </h3>
              <p className="text-zinc-400 text-sm mb-4">
                Add friends to find movies you both want to watch!
              </p>
              <a
                href="/friends"
                className="inline-block px-6 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl font-medium hover:bg-emerald-500/30 transition-colors"
              >
                Add Friends
              </a>
            </div>
          )}
        </div>
      </main>

      <Navbar />
    </div>
  );
}
