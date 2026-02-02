import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { groups, groupMembers, users, friendships } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { canonicalFriendshipOrder } from '@/lib/utils';

// POST: Add a member to the group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { groupId } = await params;
  const { userId, email } = await request.json();
  const myId = session.user.id;

  // Check if current user is a member of the group
  const myMembership = await db.query.groupMembers.findFirst({
    where: and(
      eq(groupMembers.groupId, groupId),
      eq(groupMembers.userId, myId)
    ),
  });

  if (!myMembership) {
    return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
  }

  // Find the user to add (by username since we use username+pin auth)
  let targetUserId = userId;
  if (email && !userId) {
    // Treat email as username for username+pin auth
    const user = await db.query.users.findFirst({
      where: eq(users.username, email.toLowerCase()),
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    targetUserId = user.id;
  }

  if (!targetUserId) {
    return NextResponse.json({ error: 'userId or email required' }, { status: 400 });
  }

  // Check if they're already a member
  const existingMembership = await db.query.groupMembers.findFirst({
    where: and(
      eq(groupMembers.groupId, groupId),
      eq(groupMembers.userId, targetUserId)
    ),
  });

  if (existingMembership) {
    return NextResponse.json({ error: 'User is already a member' }, { status: 409 });
  }

  // Optionally: Check if they're friends (uncomment if you want this restriction)
  // const [userA, userB] = canonicalFriendshipOrder(myId, targetUserId);
  // const friendship = await db.query.friendships.findFirst({
  //   where: and(
  //     eq(friendships.userA, userA),
  //     eq(friendships.userB, userB),
  //     eq(friendships.status, 'accepted')
  //   ),
  // });
  // if (!friendship) {
  //   return NextResponse.json({ error: 'You can only add friends to groups' }, { status: 403 });
  // }

  // Add the member
  await db.insert(groupMembers).values({
    groupId,
    userId: targetUserId,
  });

  return NextResponse.json({ success: true });
}

// DELETE: Remove yourself from a group
export async function DELETE(
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
    return NextResponse.json({ error: 'You are not a member of this group' }, { status: 404 });
  }

  // Remove the member
  await db
    .delete(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, myId)
      )
    );

  return NextResponse.json({ success: true });
}
