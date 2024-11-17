import { NextResponse } from 'next/server';
import transporter from '@/lib/mailer/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { generateReceipt } from '@/lib/utils/generateReceipt';
import { format } from 'date-fns';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { orderId, paymentId, amount, userId, orderTitle, orderDetails } = await request.json();

    if (!orderId || !paymentId || !amount || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch user email from users collection
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('User not found:', userId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userEmail = userDoc.data()?.email;

    if (!userEmail) {
      console.error('User email not found for user:', userId);
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Read email template
    const templatePath = join(process.cwd(), 'components', 'email_templates', 'payment-successful.html');
    let emailTemplate = readFileSync(templatePath, 'utf8');

    // Replace placeholders with actual values
    emailTemplate = emailTemplate
      .replace('{{date}}', format(new Date(), "MMMM d, yyyy h:mm a"))
      .replace('{{orderId}}', orderId)
      .replace('{{paymentId}}', paymentId)
      .replace('{{orderTitle}}', orderTitle)
      .replace('{{subject}}', orderDetails.subject)
      .replace('{{type}}', orderDetails.type)
      .replace('{{pages}}', orderDetails.pages.toString())
      .replace('{{amount}}', amount.toFixed(2));

    // Send email without attachment
    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to: userEmail,
      subject: 'Payment Successful - A+ Essays',
      html: emailTemplate
    });

    return NextResponse.json({ 
      success: true,
      message: 'Payment success email sent'
    });

  } catch (error: any) {
    console.error('Error sending payment success email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
} 