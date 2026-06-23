import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'ryoiki-super-secret-key-123!';

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();
    if (!email || !otp) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const otpDoc = await db.collection('otps').doc(email).get();
    if (!otpDoc.exists) return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });

    const data = otpDoc.data();
    if (!data || data.otp !== otp || Date.now() > data.expiresAt) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    const uuid = uuidv4();
    await db.collection('users').doc(uuid).set({
      uuid,
      username: data.username,
      email: email,
      password: data.password,
      skin_url: '',
      cosmetics: '[]',
      createdAt: Date.now()
    });

    await db.collection('otps').doc(email).delete();

    const token = jwt.sign({ uuid, username: data.username }, JWT_SECRET, { expiresIn: '30d' });
    return NextResponse.json({ message: 'Account created successfully', token, uuid, username: data.username });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
