import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const { uuid, newUsername } = await req.json();

    if (!uuid || !newUsername) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if new username is already taken
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('username', '==', newUsername).get();
    
    if (!snapshot.empty) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
    }

    // Update the username
    await db.collection('users').doc(uuid).update({
      username: newUsername
    });

    return NextResponse.json({ message: 'Username updated successfully', username: newUsername });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
