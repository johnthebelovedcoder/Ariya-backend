import { NextRequest } from 'next/server';
import { GuestService } from '@/lib/guest-service';
import { requireAuthApi, createApiResponse, createApiError } from '@/lib/api-utils';

// GET /api/guests - Get all guests for an event
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
    const eventId = searchParams.get('eventId');
    
    // Validate parameters
    if (!eventId) {
      return createApiError('eventId is required', 400);
    }
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return createApiError('Invalid pagination parameters', 400);
    }
    
    const result = await GuestService.getEventGuests(eventId, user.id, page, limit);
    
    return createApiResponse(result, 'Guests retrieved successfully');
  } catch (error: unknown) {
    console.error('Error retrieving guests:', error);
    
    if (error instanceof Error && error.message === 'Event not found or you do not have permission to access it') {
      return createApiError(error.message, 404);
    }
    
    return createApiError('Failed to retrieve guests', 500);
  }
}

// POST /api/guests - Create a new guest
export async function POST(request: NextRequest) {
  const authResult = await requireAuthApi();
  
  if (!('session' in authResult)) {
    return authResult; // Return error response
  }
  
  const { user } = authResult;
  
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['eventId', 'name', 'email', 'invitedBy'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    const guest = await GuestService.createGuest({
      eventId: body.eventId,
      name: body.name,
      email: body.email,
      dietaryRestrictions: body.dietaryRestrictions,
      invitedBy: body.invitedBy,
    }, user.id);
    
    return createApiResponse(guest, 'Guest added successfully', 201);
  } catch (error: unknown) {
    console.error('Error adding guest:', error);
    
    if (error instanceof Error && error.message === 'Event not found or you do not have permission to add guests to it') {
      return createApiError(error.message, 404);
    }
    
    if (error instanceof Error && error.message === 'Invalid email format') {
      return createApiError(error.message, 400);
    }
    
    if (error instanceof Error && error.message === 'Guest with this email already exists for this event') {
      return createApiError(error.message, 409);
    }
    
    return createApiError('Failed to add guest', 500);
  }
}