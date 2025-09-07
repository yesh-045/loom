// Stub middleware - no authentication required
import { NextResponse } from 'next/server';

export function middleware() {
  // Allow all requests to pass through
  return NextResponse.next();
}

export const config = { 
  matcher: [
    // Apply middleware to all routes except static files
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
}