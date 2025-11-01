import { NextRequest } from 'next/server';
import { EventService } from '@/lib/event-service';
import { requireAuthApi, createApiResponse, createApiError } from '@/lib/api-utils';

// GET /api/events/[id] - Get event by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  if (!id) {
    return createApiError('Event ID is required', 400);
  }
  
  const authResult = await requireAuthApi();
  
  if (!('session' in authResult)) {
    return authResult; // Return error response
  }
  
  const { user } = authResult;
  
  try {
    const event = await EventService.getEventById(id, user.id);
    
    if (!event) {
      return createApiError('Event not found or you do not have permission to access it', 404);
    }
    
    return createApiResponse(event, 'Event retrieved successfully');
  } catch (error: unknown) {
    console.error('Error retrieving event:', error);
    return createApiError('Failed to retrieve event', 500);
  }
}

// PUT /api/events/[id] - Update event by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  if (!id) {
    return createApiError('Event ID is required', 400);
  }
  
  const authResult = await requireAuthApi();
  
  if (!('session' in authResult)) {
    return authResult; // Return error response
  }
  
  const { user } = authResult;
  
  try {
    const body = await request.json();
    
    // Validate date format if provided
    if (body.date) {
      const eventDate = new Date(body.date);
      if (isNaN(eventDate.getTime())) {
        return createApiError('Invalid date format', 400);
      }
      body.date = eventDate;
    }
    
    // Validate numeric fields if provided
    if (body.budget !== undefined && (typeof body.budget !== 'number' || body.budget < 0)) {
      return createApiError('Budget must be a positive number', 400);
    }
    
    if (body.guestCount !== undefined && (typeof body.guestCount !== 'number' || body.guestCount < 0)) {
      return createApiError('Guest count must be a non-negative number', 400);
    }
    
    const event = await EventService.updateEvent(id, user.id, {
      name: body.name,
      type: body.type,
      date: body.date,
      location: body.location,
      budget: body.budget,
      guestCount: body.guestCount,
      theme: body.theme,
      notes: body.notes,
      status: body.status,
    });
    
    if (!event) {
      return createApiError('Event not found or you do not have permission to update it', 404);
    }
    
    return createApiResponse(event, 'Event updated successfully');
  } catch (error: unknown) {
    console.error('Error updating event:', error);
    return createApiError('Failed to update event', 500);
  }
}

// DELETE /api/events/[id] - Delete event by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  if (!id) {
    return createApiError('Event ID is required', 400);
  }
  
  const authResult = await requireAuthApi();
  
  if (!('session' in authResult)) {
    return authResult; // Return error response
  }
  
  const { user } = authResult;
  
  try {
    const result = await EventService.deleteEvent(id, user.id);
    
    if (!result) {
      return createApiError('Event not found or you do not have permission to delete it', 404);
    }
    
    return createApiResponse(null, 'Event deleted successfully');
  } catch (error: unknown) {
    console.error('Error deleting event:', error);
    return createApiError('Failed to delete event', 500);
  }
}