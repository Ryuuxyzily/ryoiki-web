import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = 'ryoiki-super-secret-key-123!';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { uuid: string };
    const uuid = decoded.uuid;

    const { password } = await req.json();
    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    const userRef = db.collection('users').doc(uuid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const data = userDoc.data()!;
    const isMatch = await bcrypt.compare(password, data.password);
    
    if (!isMatch) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 403 });
    }

    // Delete user from Firestore
    await userRef.delete();

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
