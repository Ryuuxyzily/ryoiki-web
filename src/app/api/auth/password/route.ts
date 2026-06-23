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

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Invalid passwords' }, { status: 400 });
    }

    const userRef = db.collection('users').doc(uuid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const data = userDoc.data()!;
    const isMatch = await bcrypt.compare(currentPassword, data.password);
    
    if (!isMatch) {
      return NextResponse.json({ error: 'Incorrect current password' }, { status: 403 });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await userRef.update({ password: hashedNewPassword });

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
