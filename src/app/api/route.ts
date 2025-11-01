import { NextRequest } from 'next/server';

// Handle API versioning at the root level
// Redirect requests from /api/* to /api/v1/* for backward compatibility
export async function GET(request: NextRequest) {
  // For GET requests to /api/* without version, redirect to v1
  const url = new URL(request.url);
  const newPath = url.pathname.replace('/api/', '/api/v1/');
  url.pathname = newPath;
  
  return Response.redirect(url, 307); // Temporary redirect
}

export async function POST(request: NextRequest) {
  // For POST requests to /api/* without version, redirect to v1
  const url = new URL(request.url);
  const newPath = url.pathname.replace('/api/', '/api/v1/');
  url.pathname = newPath;
  
  return Response.redirect(url, 307); // Temporary redirect
}

export async function PUT(request: NextRequest) {
  // For PUT requests to /api/* without version, redirect to v1
  const url = new URL(request.url);
  const newPath = url.pathname.replace('/api/', '/api/v1/');
  url.pathname = newPath;
  
  return Response.redirect(url, 307); // Temporary redirect
}

export async function DELETE(request: NextRequest) {
  // For DELETE requests to /api/* without version, redirect to v1
  const url = new URL(request.url);
  const newPath = url.pathname.replace('/api/', '/api/v1/');
  url.pathname = newPath;
  
  return Response.redirect(url, 307); // Temporary redirect
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  // For OPTIONS requests to /api/* without version, redirect to v1
  const url = new URL(request.url);
  const newPath = url.pathname.replace('/api/', '/api/v1/');
  url.pathname = newPath;
  
  return Response.redirect(url, 307); // Temporary redirect
}