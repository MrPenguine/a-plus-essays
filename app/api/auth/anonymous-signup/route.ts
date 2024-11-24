import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { dbService } from '@/lib/firebase/db-service';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function POST(request: Request) {
  try {
    const { email, referralCode, userId } = await request.json();

    // If user is already logged in, get their email from users collection
    if (userId) {
      const userDoc = await dbService.getUserById(userId);
      if (userDoc) {
        return NextResponse.json({ 
          success: true,
          existingUser: true,
          email: userDoc.email
        });
      }
    }

    // Check if email exists in Firebase Auth
    try {
      const userRecord = await adminAuth.getUserByEmail(email);
      if (userRecord) {
        return NextResponse.json({ 
          success: false,
          error: 'Email already registered',
          redirect: '/auth/signin'
        });
      }
    } catch (error) {
      // Error means user doesn't exist, which is what we want
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Check if email exists in Firestore users collection
    const usersRef = collection(db, 'users');
    const emailQuery = query(usersRef, where('email', '==', email));
    const emailSnapshot = await getDocs(emailQuery);

    if (!emailSnapshot.empty) {
      return NextResponse.json({ 
        success: false,
        error: 'Email already registered',
        redirect: '/auth/signin'
      });
    }

    // Create anonymous user
    const userRecord = await adminAuth.createUser({
      email,
      emailVerified: false,
      disabled: false
    });

    // Create user in database
    await dbService.createUser({
      userid: userRecord.uid,
      email: email,
      name: '',
      balance: 0,
      createdAt: new Date().toISOString(),
      isAnonymous: true
    });

    // Handle referral if code exists
    if (referralCode) {
      const referralsRef = collection(db, 'referrals');
      const q = query(referralsRef, where('referralCode', '==', referralCode));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const referralDoc = snapshot.docs[0];
        await updateDoc(doc(referralsRef, referralDoc.id), {
          referred_uid: userRecord.uid,
          updatedAt: new Date().toISOString()
        });
      }
    }

    // Create custom token for client-side sign in
    const customToken = await adminAuth.createCustomToken(userRecord.uid);

    return NextResponse.json({ 
      success: true,
      token: customToken,
      userId: userRecord.uid,
      email: email
    });

  } catch (error) {
    console.error('Error in anonymous signup:', error);
    return NextResponse.json(
      { error: 'Failed to create anonymous user' },
      { status: 500 }
    );
  }
} 