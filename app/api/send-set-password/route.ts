import { NextResponse } from 'next/server';
import transporter from '@/lib/mailer/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { adminAuth } from '@/lib/firebase/admin';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Get user by email
    const userRecord = await adminAuth.getUserByEmail(email);

    // Check if user has password provider
    const hasPasswordProvider = userRecord.providerData.some(
      provider => provider.providerId === 'password'
    );

    if (!hasPasswordProvider) {
      // Generate password reset link
      const resetLink = await adminAuth.generatePasswordResetLink(email);

      // Update user in Firestore to mark as non-anonymous
      await adminDb.collection('users').doc(userRecord.uid).update({
        isAnonymous: false
      });

      // Read email template
      const templatePath = join(process.cwd(), 'components', 'email_templates', 'set-password.html');
      let emailTemplate = readFileSync(templatePath, 'utf8');

      // Replace the reset password link
      emailTemplate = emailTemplate.replace(
        'Set password</a>',
        `Set password</a>`
      ).replace(
        '<a class="t28" href="https://tabular.email"',
        `<a class="t28" href="${resetLink}"`
      );

      // Send email
      await transporter.sendMail({
        from: process.env.SMTP_FROM_EMAIL,
        to: email,
        subject: 'Set Your Password - A+ Essays',
        html: emailTemplate,
      });

      return NextResponse.json({ 
        success: true,
        message: 'Set password email sent successfully'
      });
    } else {
      // User already has password provider, send regular reset
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
    }

  } catch (error: any) {
    console.error('Error sending password email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
} 