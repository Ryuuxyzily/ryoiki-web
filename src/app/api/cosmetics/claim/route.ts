import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'ryoiki-super-secret-key-123!';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { uuid: string };
    const uuid = decoded.uuid;

    const { cosmeticId } = await req.json();
    if (!cosmeticId) return NextResponse.json({ error: 'Missing cosmeticId' }, { status: 400 });

    const userDocRef = db.collection('users').doc(uuid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const data = userDoc.data()!;
    let ownedCosmetics: string[] = JSON.parse(data.owned_cosmetics || '[]');

    if (!ownedCosmetics.includes(cosmeticId)) {
      ownedCosmetics.push(cosmeticId);
      await userDocRef.update({
        owned_cosmetics: JSON.stringify(ownedCosmetics)
      });
    }

    return NextResponse.json({ message: 'Cosmetic claimed successfully', owned_cosmetics: ownedCosmetics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
