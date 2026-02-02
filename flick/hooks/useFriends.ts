'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Friend {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
}

interface Friendship {
  id: string;
  status: string;
  friend: Friend | null;
  isIncoming: boolean;
  createdAt: string;
}

async function fetchFriends(): Promise<Friendship[]> {
  const response = await fetch('/api/friends');
  if (!response.ok) throw new Error('Failed to fetch friends');
  return response.json();
}

async function sendFriendRequest(data: { email?: string; userId?: string; username?: string }) {
  // If email is provided without username, treat it as username for username+pin auth
  const payload = data.username ? data : { ...data, username: data.email };
  
  const response = await fetch('/api/friends', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send friend request');
  }
  
  return response.json();
}

async function acceptFriendRequest(friendshipId: string) {
  const response = await fetch(`/api/friends/${friendshipId}/accept`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to accept friend request');
  }
  
  return response.json();
}

async function declineFriendRequest(friendshipId: string) {
  const response = await fetch(`/api/friends/${friendshipId}/decline`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to decline friend request');
  }
  
  return response.json();
}

export function useFriends() {
  return useQuery({
    queryKey: ['friends'],
    queryFn: fetchFriends,
  });
}

export function useFriendActions() {
  const queryClient = useQueryClient();

  const sendRequestMutation = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });

  const acceptMutation = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: declineFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });

  return {
    sendRequest: sendRequestMutation.mutateAsync,
    acceptRequest: acceptMutation.mutate,
    declineRequest: declineMutation.mutate,
    isSending: sendRequestMutation.isPending,
    isAccepting: acceptMutation.isPending,
    isDeclining: declineMutation.isPending,
  };
}
