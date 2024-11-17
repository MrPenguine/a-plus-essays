import { NextResponse } from 'next/server';
import transporter from '@/lib/mailer/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Generate password reset link using Firebase Admin
    const resetLink = await adminAuth.generatePasswordResetLink(email);

    // Read email template
    const templatePath = join(process.cwd(), 'components', 'email_templates', 'forgot-password.html');
    let emailTemplate = readFileSync(templatePath, 'utf8');

    // Replace the reset password link
    emailTemplate = emailTemplate.replace(
      'Reset password</a>',
      `Reset password</a>`
    ).replace(
      '<a class="t28" href="https://tabular.email"',
      `<a class="t28" href="${resetLink}"`
    );

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to: email,
      subject: 'Reset Your Password - A+ Essays',
      html: emailTemplate,
    });

    return NextResponse.json({ 
      success: true,
      message: 'Password reset email sent successfully'
    });

  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
} 