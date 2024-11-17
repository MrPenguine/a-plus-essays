import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { dbService } from '@/lib/firebase/db-service';

export async function GET(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the token
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');

    // Fetch orders
    const orders = await dbService.getOrders(decodedToken.uid, limit ? parseInt(limit) : undefined);

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error in fetch-orders API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
