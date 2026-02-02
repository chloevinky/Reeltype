import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { friendships, swipes, watches, users, moviesCache } from '@/lib/db/schema';
import { eq, or, and, desc, inArray } from 'drizzle-orm';

// GET: Get activity feed from friends
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const myId = session.user.id;

  // Get accepted friends
  const myFriendships = await db
    .select({
      userA: friendships.userA,
      userB: friendships.userB,
    })
    .from(friendships)
    .where(
      and(
        or(
          eq(friendships.userA, myId),
          eq(friendships.userB, myId)
        ),
        eq(friendships.status, 'accepted')
      )
    );

  const friendIds = myFriendships.map(f => 
    f.userA === myId ? f.userB : f.userA
  );

  if (friendIds.length === 0) {
    return NextResponse.json([]);
  }

  // Get recent right swipes from friends
  const recentSwipes = await db
    .select({
      id: swipes.id,
      userId: swipes.userId,
      tmdbId: swipes.tmdbId,
      createdAt: swipes.swipedAt,
      movieTitle: moviesCache.title,
      moviePoster: moviesCache.posterPath,
    })
    .from(swipes)
    .leftJoin(moviesCache, eq(swipes.tmdbId, moviesCache.tmdbId))
    .where(
      and(
        inArray(swipes.userId, friendIds),
        eq(swipes.direction, 'right')
      )
    )
    .orderBy(desc(swipes.swipedAt))
    .limit(20);

  // Get recent watches from friends
  const recentWatches = await db
    .select({
      id: watches.id,
      userId: watches.userId,
      tmdbId: watches.tmdbId,
      createdAt: watches.watchedAt,
      reaction: watches.reaction,
      movieTitle: moviesCache.title,
      moviePoster: moviesCache.posterPath,
    })
    .from(watches)
    .leftJoin(moviesCache, eq(watches.tmdbId, moviesCache.tmdbId))
    .where(inArray(watches.userId, friendIds))
    .orderBy(desc(watches.watchedAt))
    .limit(20);

  // Get user details for all involved users
  const allUserIds = [...new Set([...recentSwipes.map(s => s.userId), ...recentWatches.map(w => w.userId)])];
  
  const userDetails = allUserIds.length > 0 
    ? await db
        .select({
          id: users.id,
          name: users.name,
          image: users.image,
        })
        .from(users)
        .where(inArray(users.id, allUserIds))
    : [];

  const userMap = new Map(userDetails.map(u => [u.id, u]));

  // Combine and sort by date
  const feed = [
    ...recentSwipes.map(s => ({
      id: s.id,
      type: 'swipe' as const,
      user: userMap.get(s.userId),
      movie: {
        id: s.tmdbId,
        title: s.movieTitle,
        posterPath: s.moviePoster,
      },
      createdAt: s.createdAt,
    })),
    ...recentWatches.map(w => ({
      id: w.id,
      type: 'watch' as const,
      user: userMap.get(w.userId),
      movie: {
        id: w.tmdbId,
        title: w.movieTitle,
        posterPath: w.moviePoster,
      },
      reaction: w.reaction,
      createdAt: w.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 30);

  return NextResponse.json(feed);
}
