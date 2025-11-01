import { NextRequest } from 'next/server';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// Helper to extract vendor ID from URL
function getVendorIdFromUrl(url: string): string | null {
  // Extract vendorId from URL - pattern: /api/events/[eventId]/vendors/[vendorId]
  const match = url.match(/\/api\/events\/[^\/]+\/vendors\/([^\/\?]+)/);
  return match ? match[1] : null;
}

// PUT /api/events/[eventId]/vendors/[vendorId] - Update vendor booking details
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: eventId } = params;
    const vendorId = getVendorIdFromUrl(request.url);
    
    if (!eventId || !vendorId) {
      return createApiError('Event ID and Vendor ID are required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Verify user has access to the event
    const eventExists = true; // Placeholder
    
    if (!eventExists) {
      return createApiError('Event not found or you do not have permission', 404);
    }
    
    const body = await request.json();
    
    // Validate update fields
    const validFields = ['amount', 'startDate', 'endDate', 'notes', 'paymentStatus', 'bookingStatus'];
    const invalidFields = Object.keys(body).filter(field => !validFields.includes(field));
    
    if (invalidFields.length > 0) {
      return createApiError(`Invalid fields: ${invalidFields.join(', ')}. Valid fields are: ${validFields.join(', ')}`, 400);
    }
    
    if (body.amount !== undefined) {
      if (typeof body.amount !== 'number' || body.amount < 0) {
        return createApiError('Amount must be a non-negative number', 400);
      }
    }
    
    if (body.startDate !== undefined) {
      const startDate = new Date(body.startDate);
      if (isNaN(startDate.getTime())) {
        return createApiError('Invalid start date format', 400);
      }
    }
    
    if (body.endDate !== undefined) {
      const endDate = new Date(body.endDate);
      if (isNaN(endDate.getTime())) {
        return createApiError('Invalid end date format', 400);
      }
      
      if (body.startDate) {
        const startDate = new Date(body.startDate);
        if (endDate < startDate) {
          return createApiError('End date must be after start date', 400);
        }
      }
    }
    
    const validBookingStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (body.bookingStatus !== undefined && !validBookingStatuses.includes(body.bookingStatus)) {
      return createApiError(`Booking status must be one of: ${validBookingStatuses.join(', ')}`, 400);
    }
    
    const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
    if (body.paymentStatus !== undefined && !validPaymentStatuses.includes(body.paymentStatus)) {
      return createApiError(`Payment status must be one of: ${validPaymentStatuses.join(', ')}`, 400);
    }
    
    // Update booking details
    const updatedBooking = {
      id: `booking_${vendorId}`,
      eventId,
      vendorId,
      amount: body.amount,
      currency: 'NGN',
      startDate: body.startDate ? new Date(body.startDate).toISOString() : undefined,
      endDate: body.endDate ? new Date(body.endDate).toISOString() : undefined,
      notes: body.notes,
      bookingStatus: body.bookingStatus || 'pending',
      paymentStatus: body.paymentStatus || 'pending',
      updatedAt: new Date().toISOString()
    };
    
    return createApiResponse(updatedBooking, 'Vendor booking details updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/events/[eventId]/vendors/[vendorId]');
  }
}

// DELETE /api/events/[eventId]/vendors/[vendorId] - Remove vendor from event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: eventId } = params;
    const vendorId = getVendorIdFromUrl(request.url);
    
    if (!eventId || !vendorId) {
      return createApiError('Event ID and Vendor ID are required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Verify user has access to the event
    const eventExists = true; // Placeholder
    
    if (!eventExists) {
      return createApiError('Event not found or you do not have permission', 404);
    }
    
    // In a real implementation, this would delete or mark the booking as cancelled
    // For now, return success response
    
    return createApiResponse(null, 'Vendor removed from event successfully', 204);
  } catch (error: any) {
    return handleApiError(error, 'DELETE /api/events/[eventId]/vendors/[vendorId]');
  }
}