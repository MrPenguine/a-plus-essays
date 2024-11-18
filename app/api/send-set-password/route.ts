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

    // Only proceed if the user is anonymous
    if (userRecord.providerData.length === 0) {
      // Convert anonymous account to email/password
      await adminAuth.updateUser(userRecord.uid, {
        email: email,
        emailVerified: false,
        password: "$2y$10$0IUMmrbEXdBn.5Kri09djelbRNT3raydvpfseZ2C0EnWwjcQ.xq3.",
        providerToLink: {
          providerId: 'password',
          email: email
        }
      });

      // Update isAnonymous in users collection
      await adminDb.collection('users').doc(userRecord.uid).update({
        isAnonymous: false
      });

      // Generate password reset link
      const resetLink = await adminAuth.generatePasswordResetLink(email);

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
        subject: 'Welcome to A+ Essays, your academic partner',
        html: emailTemplate,
      });

      return NextResponse.json({ 
        success: true,
        message: 'Set password email sent successfully'
      });
    } else {
      // Instead of returning an error, indicate that the user should enter password
      return NextResponse.json({ 
        success: true,
        showPassword: true,
        message: 'User has password set'
      });
    }

  } catch (error: any) {
    console.error('Error sending set password email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
} 