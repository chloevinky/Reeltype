'use client';

import { useState, useRef, useCallback, useEffect, createRef } from 'react';
import type { RefObject } from 'react';
import TinderCard from 'react-tinder-card';
import { SwipeCard, type Movie } from './SwipeCard';

interface SwipeDeckProps {
  movies: Movie[];
  onSwipe: (movie: Movie, direction: 'left' | 'right') => void;
  onEmpty?: () => void;
}

export function SwipeDeck({ movies, onSwipe, onEmpty }: SwipeDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(movies.length - 1);
  const currentIndexRef = useRef(currentIndex);
  const canSwipeRef = useRef(true);
  const childRefs = useRef<RefObject<{ swipe: (dir: 'left' | 'right') => void } | null>[]>([]);

  useEffect(() => {
    childRefs.current = Array(movies.length)
      .fill(0)
      .map((_, i) => childRefs.current[i] ?? createRef<{ swipe: (dir: 'left' | 'right') => void } | null>());
  }, [movies.length]);

  // Update refs when props change
  if (currentIndex !== movies.length - 1 && movies.length > 0) {
    setCurrentIndex(movies.length - 1);
    currentIndexRef.current = movies.length - 1;
  }

  const handleSwipe = useCallback((direction: string, index: number) => {
    if (!canSwipeRef.current) return;
    
    const movie = movies[index];
    if (movie && (direction === 'left' || direction === 'right')) {
      onSwipe(movie, direction);
    }

    currentIndexRef.current = index - 1;
    setCurrentIndex(index - 1);

    if (index === 0 && onEmpty) {
      setTimeout(onEmpty, 300);
    }
  }, [movies, onSwipe, onEmpty]);

  const handleCardLeftScreen = useCallback(() => {
    canSwipeRef.current = true;
  }, []);

  const triggerSwipe = useCallback((direction: 'left' | 'right') => {
    if (currentIndexRef.current < 0) return;
    const cardRef = childRefs.current[currentIndexRef.current];
    if (!cardRef?.current) return;
    canSwipeRef.current = false;
    cardRef.current.swipe(direction);
  }, []);

  if (movies.length === 0) {
    return (
      <div className="relative w-full max-w-[400px] aspect-[2/3] mx-auto flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🎬</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No more movies!
          </h3>
          <p className="text-zinc-400">
            Check back later for more recommendations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[400px] aspect-[2/3] mx-auto">
      {movies.map((movie, index) => (
        <TinderCard
          key={movie.tmdbId}
          ref={childRefs.current[index]}
          onSwipe={(dir) => handleSwipe(dir, index)}
          onCardLeftScreen={handleCardLeftScreen}
          preventSwipe={['up', 'down']}
          swipeRequirementType="position"
          swipeThreshold={100}
          className="absolute inset-0"
        >
          <SwipeCard
            movie={movie}
            style={{
              zIndex: movies.length - index,
              transform: index === currentIndex ? 'none' : `scale(${1 - (currentIndex - index) * 0.03})`,
              opacity: index < currentIndex - 2 ? 0 : 1,
            }}
          />
        </TinderCard>
      ))}

      {/* Swipe buttons */}
      <div className="absolute -bottom-20 left-0 right-0 flex items-center justify-center gap-8">
        <button
          onClick={() => {
            triggerSwipe('left');
          }}
          disabled={currentIndexRef.current < 0}
          className="w-14 h-14 rounded-full bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <button
          onClick={() => {
            triggerSwipe('right');
          }}
          disabled={currentIndexRef.current < 0}
          className="w-14 h-14 rounded-full bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
