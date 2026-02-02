import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { watches, watchCompanions, moviesCache } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// POST: Log a watched movie
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tmdbId, companionIds = [], reaction, note } = await request.json();

  if (!tmdbId) {
    return NextResponse.json({ error: 'tmdbId required' }, { status: 400 });
  }

  if (reaction && !['loved', 'good', 'meh', 'hated'].includes(reaction)) {
    return NextResponse.json({ error: 'Invalid reaction' }, { status: 400 });
  }

  // Create the watch record
  const [watch] = await db
    .insert(watches)
    .values({
      userId: session.user.id,
      tmdbId,
      reaction,
      note,
    })
    .returning();

  // Add companions if any
  if (companionIds.length > 0) {
    await db.insert(watchCompanions).values(
      companionIds.map((userId: string) => ({
        watchId: watch.id,
        userId,
      }))
    );
  }

  return NextResponse.json(watch);
}

// GET: Get watch history
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const history = await db
    .select({
      id: watches.id,
      tmdbId: watches.tmdbId,
      watchedAt: watches.watchedAt,
      reaction: watches.reaction,
      note: watches.note,
      title: moviesCache.title,
      posterPath: moviesCache.posterPath,
    })
    .from(watches)
    .leftJoin(moviesCache, eq(watches.tmdbId, moviesCache.tmdbId))
    .where(eq(watches.userId, session.user.id))
    .orderBy(desc(watches.watchedAt));

  return NextResponse.json(history);
}
