import { NextRequest } from 'next/server';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// PUT /api/events/[eventId]/guests/[guestId]/rsvp - Update RSVP status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; guestId: string } }
) {
  try {
    const { id: eventId, guestId } = params;
    
    if (!eventId || !guestId) {
      return createApiError('Event ID and Guest ID are required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    if (!body.rsvp) {
      return createApiError('RSVP status is required', 400);
    }
    
    // Validate RSVP status
    const validRsvpStatuses = ['YES', 'NO', 'MAYBE', 'NOT_RESPONDED'];
    if (!validRsvpStatuses.includes(body.rsvp.toUpperCase())) {
      return createApiError(`Invalid RSVP status. Must be one of: ${validRsvpStatuses.join(', ')}`, 400);
    }
    
    // In a real implementation, we would update the guest's RSVP status in the database
    // For now, we'll return mock data
    const updatedRsvp = {
      eventId,
      guestId,
      rsvp: body.rsvp.toUpperCase(),
      respondedAt: new Date()
    };
    
    return createApiResponse(updatedRsvp, 'RSVP status updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/events/[eventId]/guests/[guestId]/rsvp');
  }
}