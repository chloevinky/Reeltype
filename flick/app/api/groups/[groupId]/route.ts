import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { groups, groupMembers, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET: Get group details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { groupId } = await params;

  // Check if user is a member
  const membership = await db.query.groupMembers.findFirst({
    where: eq(groupMembers.groupId, groupId),
  });

  if (!membership) {
    return NextResponse.json({ error: 'Group not found or not a member' }, { status: 404 });
  }

  // Get group details
  const group = await db.query.groups.findFirst({
    where: eq(groups.id, groupId),
  });

  if (!group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  // Get all members
  const members = await db
    .select({
      userId: groupMembers.userId,
      joinedAt: groupMembers.joinedAt,
      name: users.name,
      username: users.username,
      image: users.image,
    })
    .from(groupMembers)
    .leftJoin(users, eq(groupMembers.userId, users.id))
    .where(eq(groupMembers.groupId, groupId));

  return NextResponse.json({
    ...group,
    members,
  });
}

// DELETE: Delete a group (only creator can delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { groupId } = await params;

  // Get the group
  const group = await db.query.groups.findFirst({
    where: eq(groups.id, groupId),
  });

  if (!group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  if (group.createdBy !== session.user.id) {
    return NextResponse.json({ error: 'Only the creator can delete this group' }, { status: 403 });
  }

  // Delete the group (cascade will remove members)
  await db.delete(groups).where(eq(groups.id, groupId));

  return NextResponse.json({ success: true });
}
