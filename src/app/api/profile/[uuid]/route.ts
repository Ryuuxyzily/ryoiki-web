import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function GET(req: Request, { params }: { params: Promise<{ uuid: string }> }) {
  try {
    const { uuid } = await params;
    const userDoc = await db.collection('users').doc(uuid).get();

    if (!userDoc.exists) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const data = userDoc.data()!;
    let createdAt = data.createdAt;

    // Fix for older accounts that were created before we added createdAt
    if (!createdAt) {
      createdAt = Date.now();
      await db.collection('users').doc(uuid).update({ createdAt });
    }

    return NextResponse.json({
      username: data.username,
      skin_url: data.skin_url,
      cosmetics: JSON.parse(data.cosmetics || '[]'),
      email: data.email,
      createdAt: createdAt
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
