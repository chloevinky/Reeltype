import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { swipes, moviesCache } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// POST: Record a swipe
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tmdbId, direction, context = 'browse' } = await request.json();

  if (!tmdbId || !['right', 'left'].includes(direction)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  // Upsert: insert or update if exists
  await db
    .insert(swipes)
    .values({
      userId: session.user.id,
      tmdbId,
      direction,
      context,
    })
    .onConflictDoUpdate({
      target: [swipes.userId, swipes.tmdbId],
      set: {
        direction,
        context,
        swipedAt: new Date(),
      },
    });

  return NextResponse.json({ success: true });
}

// GET: Return user's "want to watch" list (right swipes only)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get right swipes with movie details
  const mySwipes = await db
    .select({
      id: swipes.id,
      tmdbId: swipes.tmdbId,
      swipedAt: swipes.swipedAt,
      title: moviesCache.title,
      posterPath: moviesCache.posterPath,
      overview: moviesCache.overview,
      releaseYear: moviesCache.releaseYear,
    })
    .from(swipes)
    .leftJoin(moviesCache, eq(swipes.tmdbId, moviesCache.tmdbId))
    .where(
      and(
        eq(swipes.userId, session.user.id),
        eq(swipes.direction, 'right')
      )
    )
    .orderBy(swipes.swipedAt);

  return NextResponse.json(mySwipes);
}
