import { NextRequest } from 'next/server';
import { GuestService } from '@/lib/guest-service';
import { requireAuthApi, createApiResponse, createApiError } from '@/lib/api-utils';

// GET /api/guests/[id] - Get guest by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  if (!id) {
    return createApiError('Guest ID is required', 400);
  }
  
  const authResult = await requireAuthApi();
  
  if (!('session' in authResult)) {
    return authResult; // Return error response
  }
  
  const { user } = authResult;
  
  try {
    const guest = await GuestService.getGuestById(id, user.id);
    
    if (!guest) {
      return createApiError('Guest not found or you do not have permission to access it', 404);
    }
    
    return createApiResponse(guest, 'Guest retrieved successfully');
  } catch (error: unknown) {
    console.error('Error retrieving guest:', error);
    return createApiError('Failed to retrieve guest', 500);
  }
}

// PUT /api/guests/[id] - Update guest by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  if (!id) {
    return createApiError('Guest ID is required', 400);
  }
  
  const authResult = await requireAuthApi();
  
  if (!('session' in authResult)) {
    return authResult; // Return error response
  }
  
  const { user } = authResult;
  
  try {
    const body = await request.json();
    
    // Validate RSVP status if provided
    if (body.rsvp && !Object.values(RSVPStatus).includes(body.rsvp)) {
      return createApiError('Invalid RSVP status', 400);
    }
    
    const guest = await GuestService.updateGuest(id, user.id, {
      name: body.name,
      email: body.email,
      rsvp: body.rsvp,
      dietaryRestrictions: body.dietaryRestrictions,
      seatNumber: body.seatNumber,
    });
    
    return createApiResponse(guest, 'Guest updated successfully');
  } catch (error: unknown) {
    console.error('Error updating guest:', error);
    
    if (error instanceof Error && error.message === 'Guest not found') {
      return createApiError(error.message, 404);
    }
    
    if (error instanceof Error && error.message === 'You do not have permission to update this guest') {
      return createApiError(error.message, 403);
    }
    
    if (error instanceof Error && error.message === 'Invalid email format') {
      return createApiError(error.message, 400);
    }
    
    if (error instanceof Error && error.message === 'Guest with this email already exists for this event') {
      return createApiError(error.message, 409);
    }
    
    return createApiError('Failed to update guest', 500);
  }
}

// DELETE /api/guests/[id] - Delete guest by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  if (!id) {
    return createApiError('Guest ID is required', 400);
  }
  
  const authResult = await requireAuthApi();
  
  if (!('session' in authResult)) {
    return authResult; // Return error response
  }
  
  const { user } = authResult;
  
  try {
    await GuestService.deleteGuest(id, user.id);
    
    return createApiResponse(null, 'Guest deleted successfully');
  } catch (error: unknown) {
    console.error('Error deleting guest:', error);
    
    if (error instanceof Error && error.message === 'Guest not found') {
      return createApiError(error.message, 404);
    }
    
    if (error instanceof Error && error.message === 'You do not have permission to delete this guest') {
      return createApiError(error.message, 403);
    }
    
    return createApiError('Failed to delete guest', 500);
  }
}