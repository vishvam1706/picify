import { NextResponse } from 'next/server';
import { verifyTokenEdge } from '@/lib/edgeAuth';

const COOKIE_NAME = 'picify_token';

// Routes that require authentication (page-level only — API auth is handled in route handlers)
const PROTECTED_PATHS = [
  '/api/users/me',
  '/api/board-folders',
  '/api/notifications',
  '/api/analytics',
  '/api/ai',
  '/api/admin',
  '/create',
  '/settings',
  '/dashboard',
  '/notifications',
];

// Routes that require admin role
const ADMIN_PATHS = ['/api/admin', '/admin'];

// Public paths — always accessible to guests (auth optional)
const PUBLIC_PATHS = [
  '/api/auth/',
  '/api/pins',          // GET feed, GET single pin
  '/api/boards',        // GET board listing, GET single board + its pins
  '/api/search',
  '/api/users/discover',
  '/api/users/profile', // public profile lookup
  '/api/webhooks/',     // Stripe webhooks (unauthenticated POST from Stripe)
  '/api/monetization/tip/confirm', // Stripe redirect after payment (no auth cookie)
];

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Skip static files, Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/public')
  ) {
    return NextResponse.next();
  }

  // Allow all OPTIONS (CORS preflight)
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  }

  // Short-circuit for explicitly public paths — always allow, no auth needed
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  // Check if this is a protected path
  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p));
  const isAdminPath = ADMIN_PATHS.some(p => pathname.startsWith(p));

  if (!isProtected && !isAdminPath) {
    return NextResponse.next();
  }

  // Get token
  const token =
    request.cookies.get(COOKIE_NAME)?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    // API routes → 401 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    // Page routes → redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token
  let payload = null;
  try {
    payload = await verifyTokenEdge(token);
  } catch (err) {
    console.error('Proxy token verification failed:', err);
  }

  if (!payload) {
    // If token is invalid, clear it so we don't infinitely loop
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Token expired or invalid' }, { status: 401 });
    }
    
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  // Admin guard
  if (isAdminPath && payload.role !== 'admin') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Forbidden — admin only' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Inject user info into headers for downstream route handlers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.id);
  requestHeaders.set('x-user-role', payload.role || 'user');

  // CORS headers on response
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || '*');
  response.headers.set('Access-Control-Allow-Credentials', 'true');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
