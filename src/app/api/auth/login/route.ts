import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { isRateLimited } from '@/lib/rateLimit';

const JWT_SECRET = 'ryoiki-super-secret-key-123!';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    
    // Rate limit: Max 10 login attempts per 5 minutes
    if (isRateLimited(`login_${ip}`, 10, 5 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const { identifier, password } = await req.json();
    if (!identifier || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const usersRef = db.collection('users');
    let userSnapshot = await usersRef.where('email', '==', identifier).limit(1).get();
    if (userSnapshot.empty) {
      userSnapshot = await usersRef.where('username', '==', identifier).limit(1).get();
    }

    if (userSnapshot.empty) return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });

    const user = userSnapshot.docs[0].data();
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });

    const token = jwt.sign({ uuid: user.uuid, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
    return NextResponse.json({ message: 'Login successful', token, uuid: user.uuid, username: user.username });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
