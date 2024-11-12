import * as admin from 'firebase-admin';

// Check if there are any Firebase apps initialized
if (!admin.apps.length) {
  try {
    // Check if all required environment variables are present
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      console.error('Missing Firebase Admin environment variables');
      throw new Error('Missing Firebase Admin configuration');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n')
      })
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const adminDb = admin.apps[0] ? admin.firestore() : null;
export const adminAuth = admin.apps[0] ? admin.auth() : null; 