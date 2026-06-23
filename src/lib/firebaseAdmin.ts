import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Load from local file during development, or from Env Vars in Vercel
let serviceAccount;

try {
  // If running locally, this file exists
  const keyPath = path.resolve(process.cwd(), 'firebase-admin-key.json');
  if (fs.existsSync(keyPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  } else {
    // If on Vercel, read from env variables
    serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    };
  }
} catch (error) {
  console.error("Failed to load Firebase credentials", error);
}

if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: `${serviceAccount.project_id || serviceAccount.projectId}.appspot.com`
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

export { admin, db, bucket };
