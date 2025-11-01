import { NextRequest } from 'next/server';
import { EventService } from '@/lib/event-service';
import { requireAuthApi, createApiResponse, createApiError } from '@/lib/api-utils';

// GET /api/events - Get all events for authenticated user
export async function GET(request: NextRequest) {
  const authResult = await requireAuthApi();
  
  if (!('session' in authResult)) {
    return authResult; // Return error response
  }
  
  const { user } = authResult;
  
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return createApiError('Invalid pagination parameters', 400);
    }
    
    const result = await EventService.getUserEvents(user.id, page, limit);
    
    return createApiResponse(result, 'Events retrieved successfully');
  } catch (error: unknown) {
    console.error('Error retrieving events:', error);
    return createApiError('Failed to retrieve events', 500);
  }
}

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
  const authResult = await requireAuthApi();
  
  if (!('session' in authResult)) {
    return authResult; // Return error response
  }
  
  const { user } = authResult;
  
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'type', 'date', 'location', 'budget'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    // Validate date format
    const eventDate = new Date(body.date);
    if (isNaN(eventDate.getTime())) {
      return createApiError('Invalid date format', 400);
    }
    
    // Validate numeric fields
    if (typeof body.budget !== 'number' || body.budget < 0) {
      return createApiError('Budget must be a positive number', 400);
    }
    
    if (body.guestCount !== undefined && (typeof body.guestCount !== 'number' || body.guestCount < 0)) {
      return createApiError('Guest count must be a non-negative number', 400);
    }
    
    const event = await EventService.createEvent({
      userId: user.id,
      name: body.name,
      type: body.type,
      date: eventDate,
      location: body.location,
      budget: body.budget,
      guestCount: body.guestCount,
      theme: body.theme,
      notes: body.notes,
    });
    
    return createApiResponse(event, 'Event created successfully', 201);
  } catch (error: unknown) {
    console.error('Error creating event:', error);
    return createApiError('Failed to create event', 500);
  }
}