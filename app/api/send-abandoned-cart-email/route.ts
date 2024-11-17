import { NextResponse } from 'next/server';
import transporter from '@/lib/mailer/config';
import { readFileSync } from 'fs';
import { join } from 'path';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://aplusessays.net';

export async function POST(request: Request) {
  try {
    const { orderId, userEmail } = await request.json();

    if (!orderId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Read email template
    const templatePath = join(process.cwd(), 'components', 'email_templates', 'continue-order.html');
    let emailTemplate = readFileSync(templatePath, 'utf8');

    // Replace the button link with absolute URL
    const paymentLink = `${BASE_URL}/payment-detail?orderId=${orderId}`;
    console.log('Generated payment link:', paymentLink); // Debug log

    emailTemplate = emailTemplate.replace(
      'Continue to Order</span>',
      `Continue to Order</span></a>`
    ).replace(
      '<span class="t12"',
      `<a href="${paymentLink}" style="text-decoration: none; color: inherit;"><span class="t12"`
    );

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to: userEmail,
      subject: 'Did you get stuck?',
      html: emailTemplate,
    });

    return NextResponse.json({ 
      success: true,
      message: 'Abandoned cart email sent successfully',
      paymentLink // Include in response for debugging
    });

  } catch (error: any) {
    console.error('Error sending abandoned cart email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
} 