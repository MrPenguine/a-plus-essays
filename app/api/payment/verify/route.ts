import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get('reference');

  if (!reference) {
    return NextResponse.json(
      { error: 'No reference provided' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Payment verification failed');
    }

    if (data.data.status === 'success') {
      // Handle successful payment here
      // Update your database, send confirmation email, etc.
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment/success`);
    } else {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment/failed`);
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment/failed`);
  }
} 