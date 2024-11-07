import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if this is a referral URL
  if (request.nextUrl.pathname === '/referred') {
    // Get the referral code
    const referralCode = request.nextUrl.searchParams.get('code');
    
    // Redirect to home with referral code
    return NextResponse.redirect(
      new URL(`/?code=${referralCode}`, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/referred',
}; 