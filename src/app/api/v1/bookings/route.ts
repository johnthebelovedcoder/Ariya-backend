import { NextRequest } from 'next/server';
import { BookingService } from '@/lib/booking-service';
import { requireAuthApi, createApiResponse, createApiError } from '@/lib/api-utils';
import { BookingStatus } from '@prisma/client';

// GET /api/bookings - Get bookings based on query parameters
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
    const eventId = searchParams.get('eventId') || undefined;
    const vendorId = searchParams.get('vendorId') || undefined;
    const status = searchParams.get('status') as BookingStatus | undefined;
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return createApiError('Invalid pagination parameters', 400);
    }
    
    let result;
    
    if (eventId) {
      // Get bookings for a specific event
      result = await BookingService.getEventBookings(eventId, user.id, page, limit);
    } else if (vendorId) {
      // Get bookings for a specific vendor
      result = await BookingService.getVendorBookings(vendorId, user.id, page, limit);
    } else {
      // Invalid parameters - need either eventId or vendorId
      return createApiError('Either eventId or vendorId is required', 400);
    }
    
    return createApiResponse(result, 'Bookings retrieved successfully');
  } catch (error: unknown) {
    console.error('Error retrieving bookings:', error);
    
    if (error instanceof Error && error.message === 'Event not found or you do not have permission to access it') {
      return createApiError(error.message, 404);
    }
    
    if (error instanceof Error && error.message === 'Vendor not found or you do not have permission to access it') {
      return createApiError(error.message, 404);
    }
    
    return createApiError('Failed to retrieve bookings', 500);
  }
}

// POST /api/bookings - Create a new booking
export async function POST(request: NextRequest) {
  const authResult = await requireAuthApi();
  
  if (!('session' in authResult)) {
    return authResult; // Return error response
  }
  
  const { user } = authResult;
  
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['eventId', 'vendorId', 'amount'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    // Validate numeric fields
    if (typeof body.amount !== 'number' || body.amount < 0) {
      return createApiError('Amount must be a positive number', 400);
    }
    
    const booking = await BookingService.createBooking({
      eventId: body.eventId,
      vendorId: body.vendorId,
      amount: body.amount,
      notes: body.notes,
    }, user.id);
    
    return createApiResponse(booking, 'Booking created successfully', 201);
  } catch (error: unknown) {
    console.error('Error creating booking:', error);
    
    if (error instanceof Error && error.message === 'Event not found or you do not have permission to book for it') {
      return createApiError(error.message, 404);
    }
    
    if (error instanceof Error && error.message === 'Vendor not found') {
      return createApiError(error.message, 404);
    }
    
    if (error instanceof Error && error.message === 'Booking already exists for this event and vendor') {
      return createApiError(error.message, 409);
    }
    
    return createApiError('Failed to create booking', 500);
  }
}