import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { groupMembers, swipes, moviesCache } from '@/lib/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';

// GET: Find movies that ALL group members want to watch
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { groupId } = await params;
  const myId = session.user.id;

  // Check if user is a member
  const membership = await db.query.groupMembers.findFirst({
    where: and(
      eq(groupMembers.groupId, groupId),
      eq(groupMembers.userId, myId)
    ),
  });

  if (!membership) {
    return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
  }

  // Get all group member IDs
  const members = await db
    .select({ userId: groupMembers.userId })
    .from(groupMembers)
    .where(eq(groupMembers.groupId, groupId));

  const memberIds = members.map(m => m.userId);
  const memberCount = memberIds.length;

  if (memberCount === 0) {
    return NextResponse.json([]);
  }

  // Find movies where ALL members have swiped right
  // This groups by tmdbId and counts how many members swiped right
  const matches = await db
    .select({
      tmdbId: swipes.tmdbId,
      swipeCount: sql<number>`count(*)`.as('swipe_count'),
    })
    .from(swipes)
    .where(
      and(
        inArray(swipes.userId, memberIds),
        eq(swipes.direction, 'right')
      )
    )
    .groupBy(swipes.tmdbId)
    .having(sql`count(*) = ${memberCount}`);

  if (matches.length === 0) {
    return NextResponse.json([]);
  }

  // Get movie details for matches
  const matchedMovieIds = matches.map(m => m.tmdbId);
  
  const moviesWithDetails = await db
    .select({
      tmdbId: moviesCache.tmdbId,
      title: moviesCache.title,
      posterPath: moviesCache.posterPath,
      overview: moviesCache.overview,
      releaseYear: moviesCache.releaseYear,
    })
    .from(moviesCache)
    .where(inArray(moviesCache.tmdbId, matchedMovieIds));

  return NextResponse.json(moviesWithDetails);
}
