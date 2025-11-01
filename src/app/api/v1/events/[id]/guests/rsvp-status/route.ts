import { NextRequest } from 'next/server';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/events/[eventId]/guests/rsvp-status - Get RSVP statistics
export async function GET(
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
    
    // In a real implementation, we would fetch RSVP statistics from the database
    // For now, we'll return mock data
    const rsvpStats = {
      eventId,
      totalGuests: 150,
      respondedGuests: 110,
      notRespondedGuests: 40,
      yesResponses: 85,
      noResponses: 15,
      maybeResponses: 10,
      responseRate: (110 / 150) * 100
    };
    
    return createApiResponse(rsvpStats, 'RSVP statistics retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/events/[eventId]/guests/rsvp-status');
  }
}