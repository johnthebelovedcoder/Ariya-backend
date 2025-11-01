import { NextRequest } from 'next/server';
import { RegistryService } from '@/lib/registry-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/registry - Get registry for an event
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    
    if (!eventId) {
      return createApiError('eventId is required', 400);
    }
    
    const registry = await RegistryService.getRegistryByEventId(eventId, user.id);
    
    if (!registry) {
      return createApiError('Registry not found or you do not have permission to access it', 404);
    }
    
    return createApiResponse(registry, 'Registry retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/registry');
  }
}

// POST /api/registry - Create a new registry
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['eventId', 'type', 'externalLinks'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    const registry = await RegistryService.createRegistry({
      eventId: body.eventId,
      type: body.type,
      externalLinks: body.externalLinks,
      thankYouNotes: body.thankYouNotes,
    }, user.id);
    
    return createApiResponse(registry, 'Registry created successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/registry');
  }
}