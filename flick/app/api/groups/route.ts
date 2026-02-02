import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { groups, groupMembers } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

// GET: List user's groups
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get groups where user is a member
  const userGroups = await db
    .select({
      id: groups.id,
      name: groups.name,
      createdBy: groups.createdBy,
      createdAt: groups.createdAt,
      memberCount: sql<number>`(
        SELECT COUNT(*) FROM group_members 
        WHERE group_members.group_id = ${groups.id}
      )`,
    })
    .from(groups)
    .innerJoin(groupMembers, eq(groups.id, groupMembers.groupId))
    .where(eq(groupMembers.userId, session.user.id));

  return NextResponse.json(userGroups);
}

// POST: Create a new group
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await request.json();

  if (!name || name.trim().length === 0) {
    return NextResponse.json({ error: 'Group name required' }, { status: 400 });
  }

  if (name.length > 100) {
    return NextResponse.json({ error: 'Group name too long' }, { status: 400 });
  }

  // Create the group
  const [group] = await db
    .insert(groups)
    .values({
      name: name.trim(),
      createdBy: session.user.id,
    })
    .returning();

  // Add creator as first member
  await db.insert(groupMembers).values({
    groupId: group.id,
    userId: session.user.id,
  });

  return NextResponse.json({
    ...group,
    memberCount: 1,
  });
}
