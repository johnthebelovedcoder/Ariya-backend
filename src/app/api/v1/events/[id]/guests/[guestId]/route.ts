import { NextRequest } from 'next/server';
import { GuestService } from '@/lib/guest-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// PUT /api/events/[eventId]/guests/[guestId] - Update guest
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
    
    // In a real implementation, we would update the guest in the database
    // For now, we'll return mock data
    const updatedGuest = {
      id: guestId,
      eventId,
      name: body.name || 'John Doe',
      email: body.email || 'john@example.com',
      phone: body.phone || '',
      dietaryRestrictions: body.dietaryRestrictions || '',
      rsvp: body.rsvp || 'MAYBE',
      invitedBy: user.id,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      updatedAt: new Date()
    };
    
    // Validate email format if provided
    if (body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return createApiError('Invalid email format', 400);
      }
    }
    
    return createApiResponse(updatedGuest, 'Guest updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/events/[eventId]/guests/[guestId]');
  }
}

// DELETE /api/events/[eventId]/guests/[guestId] - Delete guest
export async function DELETE(
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
    
    // In a real implementation, we would delete the guest from the database
    // For now, we'll return a success response
    
    return createApiResponse(null, 'Guest deleted successfully');
  } catch (error: any) {
    return handleApiError(error, 'DELETE /api/events/[eventId]/guests/[guestId]');
  }
}