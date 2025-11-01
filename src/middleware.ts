import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

// Note: Cannot use absolute imports in middleware due to Next.js limitations
import { ConfigService } from './lib/config-service';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://yourdomain.com'),
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, X-Access-Token, X-Client, X-Country-Code, X-Currency-Code',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
    return response;
  }

  // Handle API versioning - rewrite /api/* to /api/v1/* (except /api/v1/* already and /api/auth/*)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/v1/') && !pathname.startsWith('/api/auth/')) {
    const newUrl = new URL(request.url);
    newUrl.pathname = pathname.replace('/api/', '/api/v1/');
    return NextResponse.rewrite(newUrl);
  }

  // Determine country from various sources
  const countryFromHeader = request.headers.get('x-country-code');
  const countryFromQuery = new URL(request.url).searchParams.get('country');
  let detectedCountry = countryFromHeader || countryFromQuery || 'NG'; // Default to Nigeria
  
  // If no country specified, try to determine from IP using a service like GeoIP
  // For this implementation, we'll use our config service
  const config = ConfigService.getInstance();
  const regionSettings = config.getRegionalSettings(detectedCountry);

  // Protected API routes (after versioning rewrite)
  const isApiAuthRoute = pathname.startsWith('/api/auth');
  const isApiRoute = pathname.startsWith('/api');

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/auth/signin',
    '/auth/signup',
    '/auth/error',
    '/api/auth',
  ];

  // Redirect to login if trying to access protected route without authentication
  if (!token && !publicRoutes.some(route => pathname.startsWith(route))) {
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // If user is authenticated, don't allow access to auth pages
  if (token && (pathname === '/auth/signin' || pathname === '/auth/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Add regional headers for API routes
  if (isApiRoute) {
    const response = NextResponse.next();
    
    // Regional headers
    response.headers.set('X-Country-Code', detectedCountry);
    response.headers.set('X-Region', config.getRegion());
    response.headers.set('X-Currency-Code', regionSettings.currency);
    response.headers.set('X-Timezone', regionSettings.timezone);
    
    // Add CORS headers for API routes
    response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://yourdomain.com'));
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, X-Access-Token, X-Client, X-Country-Code, X-Currency-Code');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Max-Age', '86400');
    
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
