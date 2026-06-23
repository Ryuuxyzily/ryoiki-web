import { NextResponse } from 'next/server';
import { db, bucket } from '@/lib/firebaseAdmin';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'ryoiki-super-secret-key-123!';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { uuid: string };
    const uuid = decoded.uuid;

    const formData = await req.formData();
    const file = formData.get('skin') as File;
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString('base64');
    
    // Construct the URL to our new self-hosted skin endpoint
    const appUrl = req.headers.get('origin') || 'https://ryoiki-web.vercel.app';
    const skinUrl = `${appUrl}/api/profile/${uuid}/skin.png?t=${Date.now()}`;

    // Update Firestore with BOTH the raw base64 data and the URL
    await db.collection('users').doc(uuid).update({ 
      skin_url: skinUrl,
      skin_data: base64Data
    });

    return NextResponse.json({ message: 'Skin updated successfully', skinUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
