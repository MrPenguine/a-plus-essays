import { NextRequest, NextResponse } from 'next/server';

// Update the route handler to use the correct Next.js types for dynamic routes
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const response = await fetch(`https://sandbox.intasend.com/api/v1/payment/status/${context.params.id}/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.INTASEND_PUBLIC_KEY}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get payment status');
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('IntaSend status check error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 