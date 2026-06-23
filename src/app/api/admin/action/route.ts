import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'ryoiki-super-secret-key-123!';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { uuid: string };
    const adminUuid = decoded.uuid;

    // Verify Admin Email
    const callerDoc = await db.collection('users').doc(adminUuid).get();
    if (!callerDoc.exists || callerDoc.data()!.email !== 'chiragrathoreyu@gmail.com') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const { action, targetUuid } = await req.json();
    if (!action || !targetUuid) {
      return NextResponse.json({ error: 'Missing action or target UUID' }, { status: 400 });
    }

    if (targetUuid === adminUuid) {
      return NextResponse.json({ error: 'You cannot perform actions on yourself' }, { status: 400 });
    }

    const targetRef = db.collection('users').doc(targetUuid);
    const targetDoc = await targetRef.get();
    
    if (!targetDoc.exists) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    const targetData = targetDoc.data()!;

    if (action === 'TOGGLE_BAN') {
      await targetRef.update({ isBanned: !targetData.isBanned });
      return NextResponse.json({ message: `User ${targetData.username} ban status toggled` });
    }

    if (action === 'TOGGLE_VIP') {
      const currentRole = targetData.role || 'User';
      const newRole = currentRole === 'VIP' ? 'User' : 'VIP';
      await targetRef.update({ role: newRole });
      return NextResponse.json({ message: `User ${targetData.username} role changed to ${newRole}` });
    }

    if (action === 'DELETE') {
      await targetRef.delete();
      return NextResponse.json({ message: `User ${targetData.username} permanently deleted` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
