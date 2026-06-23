import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.length < 3) {
      return NextResponse.json({ error: 'Search query must be at least 3 characters' }, { status: 400 });
    }

    // Since Firestore doesn't support native case-insensitive substring search,
    // we fetch a larger pool of users and filter them in memory for the best experience.
    const usersRef = db.collection('users');
    const snapshot = await usersRef.limit(500).get();

    const results: any[] = [];
    const searchLower = query.toLowerCase();

    snapshot.forEach((doc: any) => {
      const data = doc.data();
      if (data.username && data.username.toLowerCase().includes(searchLower)) {
        results.push({
          uuid: data.uuid,
          username: data.username,
          skin_url: data.skin_url,
          cosmetics: JSON.parse(data.cosmetics || '[]'),
          createdAt: data.createdAt,
          role: data.role || 'User',
          isBanned: data.isBanned || false
        });
      }
    });

    // Sort to show exact matches first, then prefix matches, then substring matches
    results.sort((a, b) => {
      const aLower = a.username.toLowerCase();
      const bLower = b.username.toLowerCase();
      if (aLower === searchLower) return -1;
      if (bLower === searchLower) return 1;
      if (aLower.startsWith(searchLower) && !bLower.startsWith(searchLower)) return -1;
      if (bLower.startsWith(searchLower) && !aLower.startsWith(searchLower)) return 1;
      return 0;
    });

    return NextResponse.json(results.slice(0, 20));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
