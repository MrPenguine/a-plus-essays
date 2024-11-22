import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const payload = {
      public_key: process.env.INTASEND_PUBLIC_KEY,
      amount: body.amount,
      currency: "USD",
      email: body.email,
      first_name: body.first_name || '',
      last_name: body.last_name || '',
      api_ref: body.orderId,
      host: process.env.NEXT_PUBLIC_BASE_URL,
      redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/orders/${body.orderId}?amount=${body.amount}`,
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/intasend/callback`,
    };

    console.log('Sending payload to IntaSend:', payload);

    const response = await fetch('https://payment.intasend.com/api/v1/checkout/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('IntaSend API response:', data);

    if (!response.ok || !data.url) {
      throw new Error(data.message || 'Failed to create checkout');
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('IntaSend checkout error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 