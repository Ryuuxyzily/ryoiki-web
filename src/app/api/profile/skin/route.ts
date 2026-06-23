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
    const fileName = `skins/${uuid}.png`;
    const fileRef = bucket.file(fileName);

    // Upload to Firebase Storage
    await fileRef.save(buffer, {
      metadata: { contentType: 'image/png' },
      public: true // Make it publicly readable
    });

    // Get public URL
    const skinUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}?t=${Date.now()}`;

    // Update Firestore
    await db.collection('users').doc(uuid).update({ skin_url: skinUrl });

    return NextResponse.json({ message: 'Skin updated successfully', skinUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
