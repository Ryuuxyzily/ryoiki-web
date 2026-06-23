import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Load from local file during development, or from Env Vars in Vercel
let serviceAccount: any;

try {
  const keyPath = path.resolve(process.cwd(), 'firebase-admin-key.json');
  if (fs.existsSync(keyPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const jsonStr = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
    serviceAccount = JSON.parse(jsonStr);
  } else if (process.env.FIREBASE_PROJECT_ID) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
    privateKey = privateKey.replace(/^"|"$/g, ''); // Remove quotes if added
    privateKey = privateKey.replace(/\\n/g, '\n'); // Fix newlines

    serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey
    };
  }
} catch (error) {
  console.error("Failed to load Firebase credentials", error);
}

// Only initialize if we have a service account and it hasn't been initialized yet
if (!admin.apps.length && serviceAccount && serviceAccount.privateKey) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: `${serviceAccount.project_id || serviceAccount.projectId}.appspot.com`
  });
}

const db = admin.apps.length ? admin.firestore() : null as any;
const bucket = admin.apps.length ? admin.storage().bucket() : null as any;

export { admin, db, bucket };
