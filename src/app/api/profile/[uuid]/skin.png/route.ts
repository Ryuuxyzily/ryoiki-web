import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function GET(req: Request, { params }: { params: Promise<{ uuid: string }> }) {
  try {
    const { uuid } = await params;
    const userDoc = await db.collection('users').doc(uuid).get();

    if (!userDoc.exists) {
      return new NextResponse('User not found', { status: 404 });
    }

    const data = userDoc.data()!;
    if (!data.skin_data) {
      // If the user has no custom skin uploaded, return 404 or redirect to a default skin
      return NextResponse.redirect('https://textures.minecraft.net/texture/1a4af718455d4aab528e7a61f86fa25e6a369d1768dcb13f7df319a713eb810b');
    }

    // Convert the base64 string back into a binary Buffer
    const buffer = Buffer.from(data.skin_data, 'base64');

    // Return the Buffer with the correct image/png Content-Type
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400', // Cache for 1 day
      },
    });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}
