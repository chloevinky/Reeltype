'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { MatchList } from '@/components/MatchList';
import { useGroupMatches } from '@/hooks/useMatches';
import { getInitials } from '@/lib/utils';

interface GroupPageProps {
  params: Promise<{ id: string }>;
}

interface Member {
  userId: string;
  name: string | null;
  email: string | null;
  image: string | null;
  joinedAt: string;
}

interface GroupDetails {
  id: string;
  name: string;
  createdBy: string | null;
  createdAt: string;
  members: Member[];
}

export default function GroupPage({ params }: GroupPageProps) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const { data: group, isLoading: isLoadingGroup } = useQuery<GroupDetails>({
    queryKey: ['groups', id],
    queryFn: async () => {
      const response = await fetch(`/api/groups/${id}`);
      if (!response.ok) throw new Error('Failed to fetch group');
      return response.json();
    },
  });

  const { data: matches, isLoading: isLoadingMatches } = useGroupMatches(id);

  const addMember = useMutation({
    mutationFn: async (memberEmail: string) => {
      const response = await fetch(`/api/groups/${id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: memberEmail }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to add member');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', id] });
      setShowAddModal(false);
      setEmail('');
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (email.trim()) {
      addMember.mutate(email.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800/50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-4">
          <Link
            href="/groups"
            className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-white hover:bg-zinc-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-white truncate">
            {group?.name || 'Group'}
          </h1>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-20 pb-24 px-4">
        <div className="max-w-lg mx-auto">
          {/* Members section */}
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                Members
              </h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-emerald-400 text-sm font-medium hover:text-emerald-300 transition-colors"
              >
                + Add
              </button>
            </div>
            <div className="flex -space-x-2">
              {group?.members.map((member) => (
                <div
                  key={member.userId}
                  className="relative"
                  title={member.name || member.email || 'Member'}
                >
                  {member.image ? (
                    <Image
                      src={member.image}
                      alt={member.name || 'Member'}
                      width={40}
                      height={40}
                      className="rounded-full border-2 border-zinc-900"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-semibold text-sm border-2 border-zinc-900">
                      {getInitials(member.name)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Match stats */}
          <div className="mb-6 p-4 bg-zinc-900/50 rounded-2xl text-center">
            <div className="text-4xl font-bold text-emerald-400 mb-1">
              {matches?.length || 0}
            </div>
            <p className="text-zinc-400">
              {matches?.length === 1 ? 'movie everyone wants to watch' : 'movies everyone wants to watch'}
            </p>
          </div>

          {/* Match list */}
          <MatchList
            matches={matches || []}
            isLoading={isLoadingMatches}
          />
        </div>
      </main>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">Add Member</h2>
            <form onSubmit={handleAddMember}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Member's email address"
                className="w-full px-4 py-3 bg-zinc-800 text-white placeholder-zinc-500 rounded-xl border border-zinc-700 focus:border-emerald-500 focus:outline-none"
                required
              />
              {error && (
                <p className="text-rose-400 text-sm mt-2">{error}</p>
              )}
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setError('');
                  }}
                  className="flex-1 py-3 bg-zinc-800 text-white rounded-xl font-medium hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMember.isPending}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  {addMember.isPending ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Navbar />
    </div>
  );
}
