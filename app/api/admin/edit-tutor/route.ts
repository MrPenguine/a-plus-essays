import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { dbService } from '@/lib/firebase/db-service';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const isAdmin = await dbService.isUserAdmin(decodedToken.uid);
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tutorId = searchParams.get('tutorId');

    if (!tutorId) {
      return NextResponse.json({ error: 'Tutor ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { tutor_name, profile_picture, highschool_cpp, masters_cpp, phd_cpp, undergraduate_cpp } = body;

    // Update tutor document
    const tutorRef = doc(db, 'tutors', tutorId);
    await updateDoc(tutorRef, {
      tutor_name,
      profile_picture: profile_picture ? `https://f005.backblazeb2.com/file/a-plus-essays/profile_pictures/${profile_picture.split('/').pop()}` : null,
      highschool_cpp: Number(highschool_cpp) || 0,
      masters_cpp: Number(masters_cpp) || 0,
      phd_cpp: Number(phd_cpp) || 0,
      undergraduate_cpp: Number(undergraduate_cpp) || 0,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in edit-tutor API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 