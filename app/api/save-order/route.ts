// @ts-nocheck

import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { dbService } from '@/lib/firebase/db-service';
import { backblazeService } from '@/lib/backblaze/file-service';
import { UploadedFile } from '@/lib/types/documents';

interface OrderData {
  title: string;
  description: string;
  assignment_type: string;
  subject: string;
  level: string;
  pages: number;
  wordcount: number;
  deadline: string;
  file_links: string[];
  userid: string;
  status: 'pending';
  paymentStatus: 'pending';
  amount_paid: number;
  createdAt: string;
  userEmail?: string;
}

if (!adminAuth) {
  throw new Error('Firebase admin not initialized');
}

export async function POST(request: Request) {
  try {
    // Verify authentication
    const authToken = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the Firebase token using admin SDK
    if (!adminAuth) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const decodedToken = await adminAuth.verifyIdToken(authToken);
    if (!decodedToken.uid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const formData = await request.formData();
    const jsonData = formData.get('data');
    
    if (!jsonData) {
      return NextResponse.json({ error: 'Missing form data' }, { status: 400 });
    }

    const data = JSON.parse(jsonData as string);

    // Validate required fields
    const requiredFields = ['title', 'assignment_type', 'subject', 'level', 'pages', 'wordcount', 'deadline'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create order data
    const orderData: OrderData = {
      title: data.title,
      description: data.description || '',
      assignment_type: data.assignment_type,
      subject: data.subject,
      level: data.level,
      pages: data.pages,
      wordcount: data.wordcount,
      deadline: data.deadline,
      file_links: [],
      userid: decodedToken.uid,
      status: 'pending',
      paymentStatus: 'pending',
      amount_paid: 0,
      createdAt: new Date().toISOString(),
      userEmail: decodedToken.email || '',
    };

    // Handle file uploads if any
    const files = formData.getAll('files');
    if (files.length > 0) {
      const uploadPromises = files.map(async (file: File) => {
        if (!(file instanceof File)) return undefined;
        
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await backblazeService.uploadFile(
          buffer,
          file.name,
          decodedToken.uid,
          'orders'
        );
        return result.fileUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      orderData.file_links = uploadedUrls.filter(url => url !== undefined) as string[];
    }

    // Save to database
    const orderId = await dbService.createOrder(orderData);

    console.log('Order created successfully, ID:', orderId);

    return NextResponse.json({ 
      success: true, 
      orderId,
      message: 'Project created successfully' 
    });

  } catch (error: any) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create project' },
      { status: 500 }
    );
  }
}
