import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, username, password } = await req.json();
    if (!email || !username || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Check if user exists
    const usersRef = db.collection('users');
    const usernameQuery = await usersRef.where('username', '==', username).get();
    const emailQuery = await usersRef.where('email', '==', email).get();

    if (!usernameQuery.empty) return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
    if (!emailQuery.empty) return NextResponse.json({ error: 'Email already registered' }, { status: 400 });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate OTP (For realism, we would email this, but we'll return it for testing)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in temporary otps collection
    await db.collection('otps').doc(email).set({
      otp,
      username,
      password: hashedPassword,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 mins
    });

    // In a real app you'd email it. We'll just print it.
    console.log(`================================`);
    console.log(`[Ryoiki Auth] OTP for ${email}: ${otp}`);
    console.log(`================================`);

    return NextResponse.json({ message: 'OTP sent to email. Please verify.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
