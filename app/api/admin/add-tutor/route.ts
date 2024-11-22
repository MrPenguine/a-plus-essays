import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { dbService } from '@/lib/firebase/db-service';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function POST(request: Request) {
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

    const body = await request.json();
    const { tutor_name, profile_picture, highschool_cpp, masters_cpp, phd_cpp, undergraduate_cpp } = body;

    // Create new tutor document
    const tutorsRef = collection(db, 'tutors');
    const tutorDoc = await addDoc(tutorsRef, {
      tutor_name,
      profile_picture: profile_picture ? `https://f005.backblazeb2.com/file/a-plus-essays/profile_pictures/${profile_picture.split('/').pop()}` : null,
      highschool_cpp: Number(highschool_cpp) || 0,
      masters_cpp: Number(masters_cpp) || 0,
      phd_cpp: Number(phd_cpp) || 0,
      undergraduate_cpp: Number(undergraduate_cpp) || 0,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true,
      tutorid: tutorDoc.id
    });

  } catch (error) {
    console.error('Error in add-tutor API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 