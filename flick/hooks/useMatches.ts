'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Match {
  tmdbId: number;
  title: string | null;
  posterPath: string | null;
  overview: string | null;
}

interface FeedItem {
  id: string;
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
  createdAt: string;
  reaction?: string | null;
}

interface WatchHistoryItem {
  id: string;
  tmdbId: number;
  title: string | null;
  posterPath: string | null;
  watchedAt: string;
  reaction: string | null;
}

async function fetchFriendMatches(friendId: string): Promise<Match[]> {
  const response = await fetch(`/api/friends/${friendId}/matches`);
  if (!response.ok) throw new Error('Failed to fetch matches');
  return response.json();
}

async function fetchGroupMatches(groupId: string): Promise<Match[]> {
  const response = await fetch(`/api/groups/${groupId}/matches`);
  if (!response.ok) throw new Error('Failed to fetch group matches');
  return response.json();
}

async function fetchFeed(): Promise<FeedItem[]> {
  const response = await fetch('/api/feed');
  if (!response.ok) throw new Error('Failed to fetch feed');
  return response.json();
}

async function fetchWatchHistory(): Promise<WatchHistoryItem[]> {
  const response = await fetch('/api/watches');
  if (!response.ok) throw new Error('Failed to fetch watch history');
  return response.json();
}

async function logWatch(data: { tmdbId: number; companionIds?: string[]; reaction?: string; note?: string }) {
  const response = await fetch('/api/watches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to log watch');
  }
  
  return response.json();
}

export function useFriendMatches(friendId: string | null) {
  return useQuery({
    queryKey: ['matches', 'friend', friendId],
    queryFn: () => fetchFriendMatches(friendId!),
    enabled: !!friendId,
  });
}

export function useGroupMatches(groupId: string | null) {
  return useQuery({
    queryKey: ['matches', 'group', groupId],
    queryFn: () => fetchGroupMatches(groupId!),
    enabled: !!groupId,
  });
}

export function useFeed() {
  return useQuery({
    queryKey: ['feed'],
    queryFn: fetchFeed,
    refetchInterval: 30000, // Poll every 30 seconds
  });
}

export function useWatchHistory() {
  return useQuery({
    queryKey: ['watches', 'history'],
    queryFn: fetchWatchHistory,
  });
}

export function useLogWatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logWatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watches'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
