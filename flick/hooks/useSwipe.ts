'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useEffect, useRef } from 'react';
import type { Movie } from '@/components/SwipeCard';

interface SwipeResponse {
  success: boolean;
}

interface MoviesResponse {
  movies: Movie[];
  hasMore: boolean;
  page: number;
}

async function fetchMovies(page: number): Promise<MoviesResponse> {
  const response = await fetch(`/api/movies/discover?page=${page}`);
  if (!response.ok) throw new Error('Failed to fetch movies');
  return response.json();
}

async function recordSwipe(tmdbId: number, direction: 'left' | 'right', context = 'browse'): Promise<SwipeResponse> {
  const response = await fetch('/api/swipes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tmdbId, direction, context }),
  });
  if (!response.ok) throw new Error('Failed to record swipe');
  return response.json();
}

async function fetchWantToWatch() {
  const response = await fetch('/api/swipes');
  if (!response.ok) throw new Error('Failed to fetch want-to-watch list');
  return response.json();
}

interface SwipeFlowOptions {
  page: number;
  onEmptyPage?: () => void;
}

export function useSwipeFlow({ page, onEmptyPage }: SwipeFlowOptions) {
  const queryClient = useQueryClient();
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const emptyPageRef = useRef<number | null>(null);
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['movies', 'discover', page],
    queryFn: () => fetchMovies(page),
    staleTime: 5 * 60 * 1000,
  });

  // Add new movies to the list when they load
  useEffect(() => {
    if (!data?.movies || data.movies.length === 0) return;
    setAllMovies(prev => {
      const existingIds = new Set(prev.map(m => m.tmdbId));
      const combined = [...prev];
      for (const movie of data.movies) {
        if (!existingIds.has(movie.tmdbId)) {
          combined.push(movie);
        }
      }
      return combined;
    });
  }, [data?.movies]);

  useEffect(() => {
    if (!data || allMovies.length > 0) return;
    if (data.movies.length > 0 || !data.hasMore) return;
    if (emptyPageRef.current === data.page) return;
    emptyPageRef.current = data.page;
    onEmptyPage?.();
  }, [data, allMovies.length, onEmptyPage]);

  const swipeMutation = useMutation({
    mutationFn: ({ tmdbId, direction }: { tmdbId: number; direction: 'left' | 'right' }) =>
      recordSwipe(tmdbId, direction),
    onSuccess: (_, { direction }) => {
      if (direction === 'right') {
        queryClient.invalidateQueries({ queryKey: ['swipes', 'mine'] });
      }
    },
  });

  const handleSwipe = useCallback((movie: Movie, direction: 'left' | 'right') => {
    swipeMutation.mutate({ tmdbId: movie.tmdbId, direction });
    setAllMovies(prev => prev.filter(m => m.tmdbId !== movie.tmdbId));
  }, [swipeMutation]);

  return {
    movies: allMovies.length > 0 ? allMovies : (data?.movies || []),
    isLoading: isLoading && allMovies.length === 0,
    hasMore: data?.hasMore ?? true,
    handleSwipe,
    refetch,
  };
}

export function useWantToWatch() {
  return useQuery({
    queryKey: ['swipes', 'mine'],
    queryFn: fetchWantToWatch,
  });
}
