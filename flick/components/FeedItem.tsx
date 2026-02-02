'use client';

import Image from 'next/image';
import { getTMDBImageUrl, formatRelativeTime, getInitials } from '@/lib/utils';

interface FeedItemProps {
  type: 'swipe' | 'watch';
  user: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  movie: {
    id: number;
    title: string | null;
    posterPath: string | null;
  };
  createdAt: Date | string;
  reaction?: string | null;
}

export function FeedItem({ type, user, movie, createdAt, reaction }: FeedItemProps) {
  const reactionEmojis: Record<string, string> = {
    loved: '❤️',
    good: '👍',
    meh: '😐',
    hated: '👎',
  };

  const actionText = type === 'swipe' 
    ? 'wants to watch' 
    : `watched ${reaction ? reactionEmojis[reaction] || '' : ''}`;

  return (
    <div className="flex items-start gap-4 p-4 bg-zinc-900/50 hover:bg-zinc-800/50 rounded-2xl transition-colors">
      {/* User avatar */}
      <div className="shrink-0">
        {user?.image ? (
          <Image
            src={user.image}
            alt={user.name || 'User'}
            width={44}
            height={44}
            className="rounded-full"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-semibold text-sm">
            {getInitials(user?.name)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-zinc-300">
          <span className="font-semibold text-white">
            {user?.name || 'Someone'}
          </span>{' '}
          {actionText}
        </p>
        <p className="text-white font-medium mt-0.5 truncate">
          {movie.title || 'Unknown Movie'}
        </p>
        <p className="text-zinc-500 text-sm mt-1">
          {formatRelativeTime(createdAt)}
        </p>
      </div>

      {/* Movie poster */}
      <div className="shrink-0 w-14 h-20 rounded-lg overflow-hidden bg-zinc-800">
        {movie.posterPath ? (
          <Image
            src={getTMDBImageUrl(movie.posterPath, 'w185')}
            alt={movie.title || ''}
            width={56}
            height={80}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">
            🎬
          </div>
        )}
      </div>
    </div>
  );
}
