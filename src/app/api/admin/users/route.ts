import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'ryoiki-super-secret-key-123!';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { uuid: string };
    const uuid = decoded.uuid;

    // Verify Admin/Mod Access
    const callerDoc = await db.collection('users').doc(uuid).get();
    if (!callerDoc.exists) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const callerRole = callerDoc.data()!.role;
    if (callerRole !== 'Founder' && callerRole !== 'Mod') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    // Fetch up to 1000 users for the admin dashboard
    const usersSnapshot = await db.collection('users').limit(1000).get();
    const users: any[] = [];
    
    usersSnapshot.forEach((doc: any) => {
      const data = doc.data();
      users.push({
        uuid: data.uuid,
        username: data.username,
        email: data.email,
        skin_url: data.skin_url,
        role: data.role || 'User',
        isBanned: data.isBanned || false,
        createdAt: data.createdAt
      });
    });

    // Sort by newest first
    users.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
