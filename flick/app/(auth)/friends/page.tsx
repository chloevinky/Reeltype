'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { FriendList } from '@/components/FriendList';
import { useFriends, useFriendActions } from '@/hooks/useFriends';

export default function FriendsPage() {
  const { data: friendships, isLoading } = useFriends();
  const { sendRequest, acceptRequest, declineRequest, isSending } = useFriendActions();
  const [showAddModal, setShowAddModal] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await sendRequest({ email });
      setEmail('');
      setShowAddModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to send request');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800/50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Friends</h1>
          <button
            onClick={() => setShowAddModal(true)}
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
          <FriendList
            friendships={friendships || []}
            onAccept={acceptRequest}
            onDecline={declineRequest}
            isLoading={isLoading}
          />
        </div>
      </main>

      {/* Add Friend Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">Add Friend</h2>
            <form onSubmit={handleSendRequest}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Friend's email address"
                className="w-full px-4 py-3 bg-zinc-800 text-white placeholder-zinc-500 rounded-xl border border-zinc-700 focus:border-emerald-500 focus:outline-none"
                required
              />
              {error && (
                <p className="text-rose-400 text-sm mt-2">{error}</p>
              )}
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-zinc-800 text-white rounded-xl font-medium hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  {isSending ? 'Sending...' : 'Send Request'}
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
