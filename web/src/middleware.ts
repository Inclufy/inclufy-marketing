import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Set security headers on all responses
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Origin validation for state-changing API requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (origin && host && !origin.includes(host)) {
      return new NextResponse('CSRF validation failed', { status: 403 });
    }
  }

  return response;
}

export const config = { matcher: ['/api/:path*'] };
