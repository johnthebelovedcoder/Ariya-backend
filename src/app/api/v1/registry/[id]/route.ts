import { NextRequest } from 'next/server';
import { RegistryService } from '@/lib/registry-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/registry/[id] - Get registry by event ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    
    if (!eventId) {
      return createApiError('Event ID is required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const registry = await RegistryService.getRegistryByEventId(eventId, user.id);
    
    if (!registry) {
      return createApiError('Registry not found or you do not have permission to access it', 404);
    }
    
    return createApiResponse(registry, 'Registry retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/registry/[id]');
  }
}

// PUT /api/registry/[id] - Update registry by event ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    
    if (!eventId) {
      return createApiError('Event ID is required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    const registry = await RegistryService.updateRegistry(
      eventId,
      user.id,
      {
        type: body.type,
        externalLinks: body.externalLinks,
        thankYouNotes: body.thankYouNotes,
      }
    );
    
    return createApiResponse(registry, 'Registry updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/registry/[id]');
  }
}

// DELETE /api/registry/[id] - Delete registry by event ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    
    if (!eventId) {
      return createApiError('Event ID is required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    await RegistryService.deleteRegistry(eventId, user.id);
    
    return createApiResponse(null, 'Registry deleted successfully');
  } catch (error: any) {
    return handleApiError(error, 'DELETE /api/registry/[id]');
  }
}