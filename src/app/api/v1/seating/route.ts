import { NextRequest } from 'next/server';
import { SeatingService } from '@/lib/seating-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/seating?eventId=... - Get seating arrangement by event ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{}> }
) {
  try {
    await params; // Await the params promise
    
    const url = new URL(request.url);
    const eventId = url.searchParams.get('eventId');
    
    if (!eventId) {
      return createApiError('Event ID is required as a query parameter', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const seating = await SeatingService.getSeatingByEventId(eventId, user.id);
    
    if (!seating) {
      return createApiError('Seating arrangement not found or you do not have permission to access it', 404);
    }
    
    return createApiResponse(seating, 'Seating arrangement retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/seating');
  }
}

// POST /api/seating - Create a new seating arrangement
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['eventId', 'layout'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    const seating = await SeatingService.createSeating({
      eventId: body.eventId,
      layout: body.layout,
    }, user.id);
    
    return createApiResponse(seating, 'Seating arrangement created successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/seating');
  }
}

// PUT /api/seating - Update seating arrangement by event ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{}> }
) {
  try {
    await params; // Await the params promise
    
    const url = new URL(request.url);
    const eventId = url.searchParams.get('eventId');
    
    if (!eventId) {
      return createApiError('Event ID is required as a query parameter', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    const seating = await SeatingService.updateSeating(
      eventId,
      user.id,
      {
        layout: body.layout,
      }
    );
    
    return createApiResponse(seating, 'Seating arrangement updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/seating');
  }
}

// DELETE /api/seating - Delete seating arrangement by event ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{}> }
) {
  try {
    await params; // Await the params promise
    
    const url = new URL(request.url);
    const eventId = url.searchParams.get('eventId');
    
    if (!eventId) {
      return createApiError('Event ID is required as a query parameter', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    await SeatingService.deleteSeating(eventId, user.id);
    
    return createApiResponse(null, 'Seating arrangement deleted successfully');
  } catch (error: any) {
    return handleApiError(error, 'DELETE /api/seating');
  }
}