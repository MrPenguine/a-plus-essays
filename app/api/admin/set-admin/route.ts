import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const { uid } = await request.json();
    
    // Set admin claim
    await adminAuth.setCustomUserClaims(uid, { admin: true });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting admin claims:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 