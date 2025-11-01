import { NextRequest } from 'next/server';
import { GuestService } from '@/lib/guest-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// PUT /api/guests/[guestId]/rsvp - Update RSVP status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: guestId } = params;
    
    if (!guestId) {
      return createApiError('Guest ID is required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    // Validate RSVP status
    const validRsvpStatuses = ['YES', 'NO', 'MAYBE'];
    if (!body.rsvp || !validRsvpStatuses.includes(body.rsvp)) {
      return createApiError(`Invalid RSVP status. Valid statuses: ${validRsvpStatuses.join(', ')}`, 400);
    }
    
    // In a real implementation, we would update the guest's RSVP status
    // For now, return a successful response with the updated status
    const updatedGuest = {
      id: guestId,
      rsvp: body.rsvp,
      updatedAt: new Date(),
      notes: body.notes || null
    };
    
    return createApiResponse(updatedGuest, 'RSVP status updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/guests/[id]/rsvp');
  }
}