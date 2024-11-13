import { auth, db } from './config';
import { signInAnonymously, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const signInAnonymousUser = async (email: string) => {
  try {
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;

    // Update profile with email
    await updateProfile(user, {
      displayName: email,
      photoURL: `mailto:${email}`
    });

    // Create or update user document
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await setDoc(userRef, {
        email: email.toLowerCase(),
        name: '',
        userid: user.uid,
        balance: 0,
        createdAt: new Date().toISOString(),
        isAnonymous: true
      });
    }

    return user;
  } catch (error) {
    console.error('Error signing in anonymously:', error);
    throw error;
  }
}; 