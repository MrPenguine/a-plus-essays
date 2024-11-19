// @ts-nocheck

import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const response = await fetch(`https://sandbox.intasend.com/api/v1/payment/status/${params.id}/`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.INTASEND_PUBLIC_KEY}`,
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
