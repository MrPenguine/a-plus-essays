import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(req: Request) {
  if (!adminDb) {
    return NextResponse.json({
      success: false,
      error: 'Server configuration error'
    }, { status: 500 });
  }

  try {
    const { formData, userId, userEmail } = await req.json();

    // Check if user exists
    const userSnapshot = await adminDb
      .collection('users')
      .where('email', '==', userEmail.toLowerCase())
      .get();

    if (!userSnapshot.empty) {
      return NextResponse.json({
        success: false,
        error: 'User already exists. Please login.',
        redirect: '/auth/signin'
      });
    }

    // Create user document
    await adminDb.collection('users').doc(userId).set({
      email: userEmail.toLowerCase(),
      name: '',
      userid: userId,
      balance: 0,
      createdAt: new Date().toISOString(),
      isAnonymous: true
    });

    // Create project
    const projectRef = adminDb.collection('projects').doc();
    await projectRef.set({
      assignmentType: formData.assignmentType,
      projectTitle: formData.projectTitle,
      userEmail: userEmail.toLowerCase(),
      userId: userId,
      createdAt: new Date().toISOString(),
      status: 'new'
    });

    return NextResponse.json({
      success: true,
      projectId: projectRef.id
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error occurred'
    }, { status: 500 });
  }
} 