import { NextRequest } from 'next/server';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// PUT /api/events/[eventId]/seating/assign - Assign guest to seat
export async function PUT(
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
    const requiredFields = ['guestId', 'tableId'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    // In a real implementation, we would assign the guest to a seat in the database
    // For now, we'll return mock data
    const assignmentResult = {
      eventId,
      guestId: body.guestId,
      guestName: body.guestName || 'Guest Name',
      tableId: body.tableId,
      tableName: body.tableName || 'Table Name',
      seatNumber: body.seatNumber || null, // If null, system assigns next available
      assignedAt: new Date(),
      assignedBy: user.id
    };
    
    return createApiResponse(assignmentResult, 'Guest assigned to table successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/events/[eventId]/seating/assign');
  }
}