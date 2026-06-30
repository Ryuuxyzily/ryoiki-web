import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

// Helper to format uuid with dashes: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
function addDashes(uuid: string): string {
  const s = uuid.replace(/-/g, '');
  if (s.length !== 32) return uuid;
  return `${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20)}`;
}

export async function GET(req: Request, { params }: { params: Promise<{ uuid: string }> }) {
  try {
    const { uuid } = await params;

    // Try the UUID as-is first, then try with dashes added (client strips dashes)
    let userDoc = await db.collection('users').doc(uuid).get();
    let resolvedUuid = uuid;
    if (!userDoc.exists) {
      const dashedUuid = addDashes(uuid);
      if (dashedUuid !== uuid) {
        userDoc = await db.collection('users').doc(dashedUuid).get();
        resolvedUuid = dashedUuid;
      }
    }

    if (!userDoc.exists) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const data = userDoc.data()!;
    let createdAt = data.createdAt;
    let role = data.role || 'User';
    let isBanned = data.isBanned || false;

    // Fix for older accounts that were created before we added createdAt
    let updates: any = {};
    if (!createdAt) {
      createdAt = Date.now();
      updates.createdAt = createdAt;
    }

    // Auto-assign Founder role
    if (data.email === 'chiragrathoreyu@gmail.com' && role !== 'Founder') {
      role = 'Founder';
      updates.role = 'Founder';
    }

    if (Object.keys(updates).length > 0) {
      await db.collection('users').doc(resolvedUuid).update(updates);
    }

    return NextResponse.json({
      username: data.username,
      skin_url: data.skin_url,
      cosmetics: JSON.parse(data.cosmetics || '[]'),
      owned_cosmetics: JSON.parse(data.owned_cosmetics || '[]'),
      email: data.email,
      createdAt: createdAt,
      role: role,
      isBanned: isBanned
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
