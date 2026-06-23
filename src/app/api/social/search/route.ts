import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.length < 3) {
      return NextResponse.json({ error: 'Search query must be at least 3 characters' }, { status: 400 });
    }

    // Prefix search in Firestore
    const usersRef = db.collection('users');
    const snapshot = await usersRef
      .where('username', '>=', query)
      .where('username', '<=', query + '\uf8ff')
      .limit(20)
      .get();

    const results: any[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      results.push({
        uuid: data.uuid,
        username: data.username,
        skin_url: data.skin_url,
        cosmetics: JSON.parse(data.cosmetics || '[]'),
        createdAt: data.createdAt
      });
    });

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
