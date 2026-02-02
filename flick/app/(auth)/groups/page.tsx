'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';

interface Group {
  id: string;
  name: string;
  memberCount: number;
  createdAt: string;
}

export default function GroupsPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');

  const { data: groups, isLoading } = useQuery<Group[]>({
    queryKey: ['groups'],
    queryFn: async () => {
      const response = await fetch('/api/groups');
      if (!response.ok) throw new Error('Failed to fetch groups');
      return response.json();
    },
  });

  const createGroup = useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error('Failed to create group');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setShowCreateModal(false);
      setGroupName('');
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (groupName.trim()) {
      createGroup.mutate(groupName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800/50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Groups</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/30 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-20 pb-24 px-4">
        <div className="max-w-lg mx-auto">
          {isLoading ? (
            <LoadingSkeleton />
          ) : groups && groups.length > 0 ? (
            <div className="space-y-3">
              {groups.map((group) => (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="block p-4 bg-zinc-900/50 hover:bg-zinc-800/50 rounded-2xl transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-semibold text-lg">
                      {group.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{group.name}</h3>
                      <p className="text-sm text-zinc-400">
                        {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </main>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">Create Group</h2>
            <form onSubmit={handleCreateGroup}>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group name (e.g. 'Movie Night Crew')"
                className="w-full px-4 py-3 bg-zinc-800 text-white placeholder-zinc-500 rounded-xl border border-zinc-700 focus:border-emerald-500 focus:outline-none"
                required
                maxLength={100}
              />
              {error && (
                <p className="text-rose-400 text-sm mt-2">{error}</p>
              )}
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-zinc-800 text-white rounded-xl font-medium hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createGroup.isPending}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  {createGroup.isPending ? 'Creating...' : 'Create'}
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

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-zinc-900/50 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-zinc-800" />
          <div className="flex-1">
            <div className="h-5 bg-zinc-800 rounded w-32 mb-2" />
            <div className="h-4 bg-zinc-800 rounded w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-12 text-center">
      <div className="text-5xl mb-4">👥</div>
      <h3 className="text-lg font-semibold text-white mb-2">No groups yet</h3>
      <p className="text-zinc-400">
        Create a group to find movies everyone wants to watch!
      </p>
    </div>
  );
}
