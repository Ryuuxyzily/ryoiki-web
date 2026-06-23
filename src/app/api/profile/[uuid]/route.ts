import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function GET(req: Request, { params }: { params: Promise<{ uuid: string }> }) {
  try {
    const { uuid } = await params;
    const userDoc = await db.collection('users').doc(uuid).get();

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
      await db.collection('users').doc(uuid).update(updates);
    }

    return NextResponse.json({
      username: data.username,
      skin_url: data.skin_url,
      cosmetics: JSON.parse(data.cosmetics || '[]'),
      email: data.email,
      createdAt: createdAt,
      role: role,
      isBanned: isBanned
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
