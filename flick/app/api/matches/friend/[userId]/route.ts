import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { swipes, moviesCache } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId: friendId } = await params;
  const myId = session.user.id;

  // Step 1: Get friend's right-swiped movie IDs
  const friendSwipes = await db
    .select({ tmdbId: swipes.tmdbId })
    .from(swipes)
    .where(and(eq(swipes.userId, friendId), eq(swipes.direction, 'right')));

  const friendMovieIds = friendSwipes.map((s) => s.tmdbId);

  if (friendMovieIds.length === 0) {
    return NextResponse.json([]);
  }

  // Step 2: Find my right swipes that overlap with friend's
  const matches = await db
    .select({
      tmdbId: swipes.tmdbId,
      title: moviesCache.title,
      posterPath: moviesCache.posterPath,
      overview: moviesCache.overview,
      releaseYear: moviesCache.releaseYear,
    })
    .from(swipes)
    .leftJoin(moviesCache, eq(swipes.tmdbId, moviesCache.tmdbId))
    .where(
      and(
        eq(swipes.userId, myId),
        eq(swipes.direction, 'right'),
        inArray(swipes.tmdbId, friendMovieIds)
      )
    );

  return NextResponse.json(matches);
}
