'use client';

import { use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { MatchList } from '@/components/MatchList';
import { useFriendMatches } from '@/hooks/useMatches';
import { getInitials } from '@/lib/utils';

interface FriendPageProps {
  params: Promise<{ id: string }>;
}

export default function FriendPage({ params }: FriendPageProps) {
  const { id } = use(params);
  const { data: matches, isLoading } = useFriendMatches(id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800/50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-4">
          <Link
            href="/friends"
            className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-white hover:bg-zinc-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-white">Matches</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-20 pb-24 px-4">
        <div className="max-w-lg mx-auto">
          {/* Match stats */}
          <div className="mb-6 p-4 bg-zinc-900/50 rounded-2xl text-center">
            <div className="text-4xl font-bold text-emerald-400 mb-1">
              {matches?.length || 0}
            </div>
            <p className="text-zinc-400">
              {matches?.length === 1 ? 'movie you both want to watch' : 'movies you both want to watch'}
            </p>
          </div>

          {/* Match list */}
          <MatchList
            matches={matches || []}
            isLoading={isLoading}
          />
        </div>
      </main>

      <Navbar />
    </div>
  );
}
