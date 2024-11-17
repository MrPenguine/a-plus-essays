import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { dbService } from '@/lib/firebase/db-service';

interface Tutor {
  tutorid: string;
  tutor_name: string;
  bio: string;
  rating: number;
  reviews: string;
  highschool_cpp: number;
  undergraduate_cpp: number;
  masters_cpp: number;
  phd_cpp: number;
  mentor: boolean;
  profile_picture?: string;
  education?: string;
  orders_completed: number;
}

interface TransformedTutor {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  education: string;
  bio: string;
  completedProjects: number;
  totalProjects: number;
  subject: string;
  price: number;
  costPerPage: number;
  isMentor: boolean;
  badges: string[];
  profilePicture?: string;
  isTopRated?: boolean;
}

export async function GET(request: Request) {
  try {
    // Get auth token from header
    const authToken = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify Firebase token
    const decodedToken = await adminAuth?.verifyIdToken(authToken);
    if (!decodedToken?.uid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get orderId from query params
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Fetch order and tutors
    const [order, tutorsData] = await Promise.all([
      dbService.getOrder(orderId),
      dbService.getTutors()
    ]);

    // Check if order exists and belongs to user
    if (!order || order.userid !== decodedToken.uid) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if tutor is already assigned
    if (order.tutorid) {
      return NextResponse.json({ 
        redirect: true,
        url: `/payment-detail?orderId=${orderId}`
      });
    }

    // Transform tutors data
    const transformedTutors = tutorsData.map((tutor: Tutor) => {
      // Get cost per page based on education level
      const getCostPerPage = () => {
        const level = order.level?.toLowerCase();
        switch (level) {
          case 'high school':
            return tutor.highschool_cpp;
          case 'undergraduate':
            return tutor.undergraduate_cpp;
          case 'masters':
            return tutor.masters_cpp;
          case 'phd':
            return tutor.phd_cpp;
          default:
            return tutor.undergraduate_cpp;
        }
      };

      const costPerPage = getCostPerPage();
      const totalPages = order.pages || 1;
      const totalPrice = costPerPage * totalPages;

      return {
        id: tutor.tutorid,
        name: tutor.tutor_name,
        rating: tutor.rating || 4.5,
        reviews: parseInt(tutor.reviews) || 0,
        education: tutor.education || "Higher Education",
        bio: tutor.bio || "No bio available",
        completedProjects: Math.floor((tutor.orders_completed || 0) / 5),
        totalProjects: tutor.orders_completed || 0,
        subject: order.subject || "General",
        price: totalPrice,
        costPerPage,
        isMentor: tutor.mentor || false,
        badges: ["AI free"],
        profilePicture: tutor.profile_picture || '/images/placeholder-avatar.jpg',
        isTopRated: false
      };
    });

    // Sort tutors and mark top rated
    const sortedTutors = transformedTutors.sort((a, b) => {
      if (a.isMentor && !b.isMentor) return -1;
      if (!a.isMentor && b.isMentor) return 1;
      return b.rating - a.rating;
    });

    if (sortedTutors.length > 0) {
      sortedTutors[0].isTopRated = true;
    }

    return NextResponse.json({
      tutors: sortedTutors,
      order
    });

  } catch (error: any) {
    console.error('Error in choose-tutor API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load tutors' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Verify authentication
    const authToken = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await adminAuth?.verifyIdToken(authToken);
    if (!decodedToken?.uid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const data = await request.json();
    const { orderId, tutorId, price } = data;

    if (!orderId || !tutorId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update order with tutor assignment
    await dbService.updateOrder(orderId, {
      tutorid: tutorId,
      price: price || 0,
      status: 'pending'
    });

    return NextResponse.json({ 
      success: true,
      message: 'Expert assigned successfully'
    });

  } catch (error: any) {
    console.error('Error assigning tutor:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to assign tutor' },
      { status: 500 }
    );
  }
}
