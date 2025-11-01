import { NextRequest } from 'next/server';
import { SeatingService } from '@/lib/seating-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// POST /api/seating/[id]/assign-seat - Assign a seat to a guest
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: eventId } = params;
    
    if (!eventId) {
      return createApiError('Event ID is required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['guestId', 'seatNumber'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    const result = await SeatingService.assignSeatToGuest(
      eventId,
      user.id,
      body.guestId,
      body.seatNumber
    );
    
    return createApiResponse(result, 'Seat assigned to guest successfully');
  } catch (error: any) {
    return handleApiError(error, 'POST /api/seating/[id]/assign-seat');
  }
}