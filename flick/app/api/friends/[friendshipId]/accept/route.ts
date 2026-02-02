import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { friendships } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ friendshipId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { friendshipId } = await params;
  const myId = session.user.id;

  // Get the friendship
  const friendship = await db.query.friendships.findFirst({
    where: eq(friendships.id, friendshipId),
  });

  if (!friendship) {
    return NextResponse.json({ error: 'Friendship not found' }, { status: 404 });
  }

  // Verify user is part of this friendship and is NOT the requester
  const isInvolved = friendship.userA === myId || friendship.userB === myId;
  const isRequester = friendship.requestedBy === myId;

  if (!isInvolved) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  if (isRequester) {
    return NextResponse.json({ error: 'Cannot accept your own request' }, { status: 400 });
  }

  if (friendship.status !== 'pending') {
    return NextResponse.json({ error: 'Request is not pending' }, { status: 400 });
  }

  // Accept the friendship
  const [updated] = await db
    .update(friendships)
    .set({ status: 'accepted' })
    .where(eq(friendships.id, friendshipId))
    .returning();

  return NextResponse.json(updated);
}
