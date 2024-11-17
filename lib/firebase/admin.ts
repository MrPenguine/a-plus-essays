import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Load and validate service account credentials
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_ADMIN_PROJECT_ID || "a-plus-essays-83fb8",
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "",
  private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || "firebase-adminsdk-jdnsz@a-plus-essays-83fb8.iam.gserviceaccount.com",
  client_id: process.env.FIREBASE_CLIENT_ID || "",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-jdnsz%40a-plus-essays-83fb8.iam.gserviceaccount.com`
};

// Validate required fields
if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
  console.error('Missing Firebase Admin configuration:', {
    project_id: !!serviceAccount.project_id,
    private_key: !!serviceAccount.private_key,
    client_email: !!serviceAccount.client_email
  });
  throw new Error('Missing required Firebase service account configuration');
}

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert(serviceAccount as any)
    });
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();