import { NextRequest } from 'next/server';
import { createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/public/events - This should probably be in [slug] directory but fixing param type for now
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{}> }
) {
  try {
    await params; // Await the params promise
    
    // This implementation doesn't actually use slug params
    // If this is meant to be a public event detail page, it should be moved to [slug]/route.ts
    // For now, returning an error since this endpoint is incorrectly structured
    
    return createApiError('This endpoint is incorrectly structured. Use /api/public/events/[slug] instead', 400);
  } catch (error: any) {
    return handleApiError(error, 'GET /api/public/events');
  }
}