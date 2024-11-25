import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const userRecord = await adminAuth.getUser(userId);
    
    let authMethod = 'password';
    
    if (userRecord.providerData.length > 0) {
      const provider = userRecord.providerData[0].providerId;
      if (provider === 'google.com') {
        authMethod = 'google';
      } else if (provider === 'password') {
        authMethod = 'password';
      }
    } else {
      authMethod = 'anonymous';
    }

    return NextResponse.json({ authMethod });
  } catch (error) {
    console.error('Error checking auth method:', error);
    return NextResponse.json(
      { error: 'Failed to check auth method' },
      { status: 500 }
    );
  }
} 