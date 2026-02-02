'use client';

import Image from 'next/image';
import Link from 'next/link';
import { getInitials } from '@/lib/utils';

interface Friend {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface Friendship {
  id: string;
  status: string;
  friend: Friend | null;
  isIncoming: boolean;
}

interface FriendListProps {
  friendships: Friendship[];
  onAccept: (friendshipId: string) => void;
  onDecline: (friendshipId: string) => void;
  isLoading: boolean;
}

export function FriendList({ friendships, onAccept, onDecline, isLoading }: FriendListProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const pendingIncoming = friendships.filter(f => f.status === 'pending' && f.isIncoming);
  const pendingOutgoing = friendships.filter(f => f.status === 'pending' && !f.isIncoming);
  const accepted = friendships.filter(f => f.status === 'accepted');

  return (
    <div className="space-y-6">
      {/* Pending incoming requests */}
      {pendingIncoming.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
            Friend Requests ({pendingIncoming.length})
          </h3>
          <div className="space-y-2">
            {pendingIncoming.map((friendship) => (
              <div
                key={friendship.id}
                className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl"
              >
                <Avatar user={friendship.friend} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">
                    {friendship.friend?.name || friendship.friend?.email || 'Unknown'}
                  </p>
                  <p className="text-sm text-zinc-500">Wants to be friends</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onAccept(friendship.id)}
                    className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onDecline(friendship.id)}
                    className="px-3 py-1.5 bg-zinc-700/50 text-zinc-400 rounded-lg text-sm font-medium hover:bg-zinc-600/50 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pending outgoing requests */}
      {pendingOutgoing.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
            Pending
          </h3>
          <div className="space-y-2">
            {pendingOutgoing.map((friendship) => (
              <div
                key={friendship.id}
                className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl"
              >
                <Avatar user={friendship.friend} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">
                    {friendship.friend?.name || friendship.friend?.email || 'Unknown'}
                  </p>
                  <p className="text-sm text-zinc-500">Request sent</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Accepted friends */}
      <section>
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
          Friends ({accepted.length})
        </h3>
        {accepted.length > 0 ? (
          <div className="space-y-2">
            {accepted.map((friendship) => (
              <Link
                key={friendship.id}
                href={`/friends/${friendship.friend?.id}`}
                className="flex items-center gap-3 p-3 bg-zinc-900/50 hover:bg-zinc-800/50 rounded-xl transition-colors"
              >
                <Avatar user={friendship.friend} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">
                    {friendship.friend?.name || friendship.friend?.email || 'Unknown'}
                  </p>
                </div>
                <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-zinc-500">
            <p>No friends yet. Send a friend request to get started!</p>
          </div>
        )}
      </section>
    </div>
  );
}

function Avatar({ user }: { user: Friend | null }) {
  if (user?.image) {
    return (
      <Image
        src={user.image}
        alt={user.name || 'User'}
        width={44}
        height={44}
        className="rounded-full"
      />
    );
  }

  return (
    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold text-sm">
      {getInitials(user?.name)}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl">
          <div className="w-11 h-11 rounded-full bg-zinc-800" />
          <div className="flex-1">
            <div className="h-5 bg-zinc-800 rounded w-32 mb-2" />
            <div className="h-4 bg-zinc-800 rounded w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
