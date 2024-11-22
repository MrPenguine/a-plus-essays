import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { dbService } from '@/lib/firebase/db-service';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { subDays, subMonths, startOfDay, endOfDay, format } from 'date-fns';

export async function GET(request: Request) {
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
    const filter = searchParams.get('filter') || 'today';

    const now = new Date();
    let startDate;

    switch (filter) {
      case 'today':
        startDate = startOfDay(now);
        break;
      case '7days':
        startDate = subDays(now, 7);
        break;
      case '30days':
        startDate = subDays(now, 30);
        break;
      case '3months':
        startDate = subMonths(now, 3);
        break;
      default:
        startDate = startOfDay(now);
    }

    const paymentsRef = collection(db, 'payments');
    const q = query(
      paymentsRef,
      where('createdAt', '>=', startDate.toISOString()),
      where('createdAt', '<=', now.toISOString()),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(q);
    const payments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Group payments by time period
    const groupedData = payments.reduce((acc: Record<string, number>, payment: any) => {
      let timeKey;
      const date = new Date(payment.createdAt);

      switch (filter) {
        case 'today':
          timeKey = format(date, 'HH:00'); // Group by hour
          break;
        case '7days':
          timeKey = format(date, 'MMM dd'); // Group by day
          break;
        case '30days':
          timeKey = format(date, 'MMM dd'); // Group by day
          break;
        case '3months':
          timeKey = format(date, 'MMM dd'); // Group by day
          break;
        default:
          timeKey = format(date, 'HH:00');
      }

      acc[timeKey] = (acc[timeKey] || 0) + payment.amount;
      return acc;
    }, {});

    return NextResponse.json({ data: groupedData });

  } catch (error) {
    console.error('Error fetching payment stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 