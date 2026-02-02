import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { friendships, users } from '@/lib/db/schema';
import { eq, or, and } from 'drizzle-orm';
import { canonicalFriendshipOrder } from '@/lib/utils';

// GET: List all friends and pending requests
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const myId = session.user.id;

  // Get all friendships involving this user
  const myFriendships = await db
    .select({
      id: friendships.id,
      userA: friendships.userA,
      userB: friendships.userB,
      status: friendships.status,
      requestedBy: friendships.requestedBy,
      createdAt: friendships.createdAt,
    })
    .from(friendships)
    .where(
      or(
        eq(friendships.userA, myId),
        eq(friendships.userB, myId)
      )
    );

  // Get user details for each friendship
  const friendsWithDetails = await Promise.all(
    myFriendships.map(async (friendship) => {
      const friendId = friendship.userA === myId ? friendship.userB : friendship.userA;
      const friend = await db.query.users.findFirst({
        where: eq(users.id, friendId),
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      });

      return {
        ...friendship,
        friend,
        isIncoming: friendship.status === 'pending' && friendship.requestedBy !== myId,
      };
    })
  );

  return NextResponse.json(friendsWithDetails);
}

// POST: Send a friend request
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId, email } = await request.json();
  let targetUserId = userId;

  // If email provided instead of userId, look up the user
  if (email && !userId) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    targetUserId = user.id;
  }

  if (!targetUserId) {
    return NextResponse.json({ error: 'userId or email required' }, { status: 400 });
  }

  if (targetUserId === session.user.id) {
    return NextResponse.json({ error: 'Cannot friend yourself' }, { status: 400 });
  }

  // Canonical ordering: smaller UUID goes in userA
  const [userA, userB] = canonicalFriendshipOrder(session.user.id, targetUserId);

  // Check if friendship already exists
  const existing = await db.query.friendships.findFirst({
    where: and(eq(friendships.userA, userA), eq(friendships.userB, userB)),
  });

  if (existing) {
    return NextResponse.json({ error: 'Friendship already exists', status: existing.status }, { status: 409 });
  }

  // Create the friendship request
  const [friendship] = await db
    .insert(friendships)
    .values({
      userA,
      userB,
      requestedBy: session.user.id,
      status: 'pending',
    })
    .returning();

  return NextResponse.json(friendship);
}
