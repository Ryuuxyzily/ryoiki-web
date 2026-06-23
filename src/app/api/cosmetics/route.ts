import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    const snapshot = await db.collection('users').get();
    const result: Record<string, string[]> = {};
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const cosmetics = JSON.parse(data.cosmetics);
      if (cosmetics.length > 0) {
        result[doc.id] = cosmetics;
      }
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { uuid, token, cape, bandana, wings, hat, pet } = await req.json();
    if (!uuid) return NextResponse.json({ error: 'Missing uuid' }, { status: 400 });

    const cosmeticsList: string[] = [];
    if (cape && cape !== 'none') cosmeticsList.push("cape_" + cape);
    if (bandana && bandana !== 'none') cosmeticsList.push("bandana_" + bandana);
    if (wings && wings !== 'none') cosmeticsList.push("wings_" + wings);

    // Update in Firestore, merging if it doesn't exist (supports offline UUIDs automatically)
    await db.collection('users').doc(uuid).set({
      cosmetics: JSON.stringify(cosmeticsList)
    }, { merge: true });

    return NextResponse.json({ message: 'Cosmetics updated' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
