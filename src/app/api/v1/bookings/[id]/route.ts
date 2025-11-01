import { NextRequest } from 'next/server';
import { BookingService } from '@/lib/booking-service';
import { requireAuthApi, createApiResponse, createApiError } from '@/lib/api-utils';

// GET /api/bookings/[id] - Get booking by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  if (!id) {
    return createApiError('Booking ID is required', 400);
  }
  
  const authResult = await requireAuthApi();
  
  if (!('session' in authResult)) {
    return authResult; // Return error response
  }
  
  const { user } = authResult;
  
  try {
    const booking = await BookingService.getBookingById(id, user.id);
    
    if (!booking) {
      return createApiError('Booking not found or you do not have permission to access it', 404);
    }
    
    return createApiResponse(booking, 'Booking retrieved successfully');
  } catch (error: unknown) {
    console.error('Error retrieving booking:', error);
    return createApiError('Failed to retrieve booking', 500);
  }
}

// PUT /api/bookings/[id] - Update booking by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  if (!id) {
    return createApiError('Booking ID is required', 400);
  }
  
  const authResult = await requireAuthApi();
  
  if (!('session' in authResult)) {
    return authResult; // Return error response
  }
  
  const { user } = authResult;
  
  try {
    const body = await request.json();
    
    // Validate numeric fields if provided
    if (body.amount !== undefined && (typeof body.amount !== 'number' || body.amount < 0)) {
      return createApiError('Amount must be a positive number', 400);
    }
    
    const booking = await BookingService.updateBooking(id, user.id, {
      status: body.status,
      amount: body.amount,
      notes: body.notes,
      paymentStatus: body.paymentStatus,
    });
    
    return createApiResponse(booking, 'Booking updated successfully');
  } catch (error: unknown) {
    console.error('Error updating booking:', error);
    
    if (error instanceof Error && error.message === 'Booking not found') {
      return createApiError(error.message, 404);
    }
    
    if (error instanceof Error && error.message === 'You do not have permission to update this booking') {
      return createApiError(error.message, 403);
    }
    
    if (error instanceof Error && error.message === 'Vendors can only update booking status') {
      return createApiError(error.message, 403);
    }
    
    return createApiError('Failed to update booking', 500);
  }
}

// DELETE /api/bookings/[id] - Delete booking by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  if (!id) {
    return createApiError('Booking ID is required', 400);
  }
  
  const authResult = await requireAuthApi();
  
  if (!('session' in authResult)) {
    return authResult; // Return error response
  }
  
  const { user } = authResult;
  
  try {
    await BookingService.deleteBooking(id, user.id);
    
    return createApiResponse(null, 'Booking deleted successfully');
  } catch (error: unknown) {
    console.error('Error deleting booking:', error);
    
    if (error instanceof Error && error.message === 'Booking not found') {
      return createApiError(error.message, 404);
    }
    
    if (error instanceof Error && error.message === 'You do not have permission to delete this booking') {
      return createApiError(error.message, 403);
    }
    
    if (error instanceof Error && error.message === 'Cannot delete a booking that has been paid') {
      return createApiError(error.message, 400);
    }
    
    return createApiError('Failed to delete booking', 500);
  }
}