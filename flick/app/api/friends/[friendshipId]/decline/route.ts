import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { friendships } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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

  // Verify user is part of this friendship
  const isInvolved = friendship.userA === myId || friendship.userB === myId;

  if (!isInvolved) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  if (friendship.status !== 'pending') {
    return NextResponse.json({ error: 'Request is not pending' }, { status: 400 });
  }

  // Delete the friendship request
  await db
    .delete(friendships)
    .where(eq(friendships.id, friendshipId));

  return NextResponse.json({ success: true });
}
