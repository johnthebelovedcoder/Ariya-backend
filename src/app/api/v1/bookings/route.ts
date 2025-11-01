import { NextRequest } from 'next/server';
import { BookingService } from '@/lib/booking-service';
import { requireAuthApi, createApiError, handleApiError } from '@/lib/api-utils';
import { CreateBookingSchema } from '@/lib/validation-schemas';
import { validateBody } from '@/middleware/validate-request';
import { checkRateLimit } from '@/middleware/rate-limit-check';
import { createRequestContext, logRequestEnd } from '@/middleware/request-context';
import { parsePagination, createPaginatedResponse } from '@/lib/pagination-utils';
import { ResponseBuilder } from '@/lib/response-builder';
import Logger from '@/lib/logger-service';
import { BookingStatus } from '@prisma/client';

/**
 * GET /api/v1/bookings
 * Get bookings for authenticated user (filtered by eventId or vendorId)
 */
export async function GET(request: NextRequest) {
  const context = createRequestContext(request);
  
  const authResult = await requireAuthApi();
  if (!('session' in authResult)) {
    logRequestEnd(context, 401);
    return authResult;
  }
  
  const { user } = authResult;
  
  try {
    await checkRateLimit(request, 'api');
    
    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePagination(searchParams);
    const eventId = searchParams.get('eventId') || undefined;
    const vendorId = searchParams.get('vendorId') || undefined;
    const status = searchParams.get('status') as BookingStatus | undefined;
    
    // Require either eventId or vendorId
    if (!eventId && !vendorId) {
      Logger.warn('Bookings request missing required parameters', {
        requestId: context.requestId,
        userId: user.id
      });
      logRequestEnd(context, 400, user.id);
      return createApiError('Either eventId or vendorId is required', 400);
    }
    
    let result;
    if (eventId) {
      result = await BookingService.getEventBookings(eventId, user.id, page, limit);
    } else {
      result = await BookingService.getVendorBookings(vendorId!, user.id, page, limit);
    }
    
    const response = createPaginatedResponse(
      result.bookings,
      result.total,
      page,
      limit
    );
    
    Logger.debug('Bookings retrieved', {
      requestId: context.requestId,
      userId: user.id,
      eventId,
      vendorId,
      count: result.bookings.length
    });
    
    logRequestEnd(context, 200, user.id);
    return ResponseBuilder.paginated(response, 'Bookings retrieved successfully');
    
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('not found or you do not have permission')) {
      Logger.warn('Booking access denied', {
        requestId: context.requestId,
        userId: user.id,
        error: error.message
      });
      logRequestEnd(context, 404, user.id);
      return createApiError(error.message, 404);
    }
    
    Logger.error('Failed to retrieve bookings', {
      requestId: context.requestId,
      userId: user.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    logRequestEnd(context, 500, user.id);
    return handleApiError(error, 'GET /api/v1/bookings');
  }
}

/**
 * POST /api/v1/bookings
 * Create a new booking
 */
export async function POST(request: NextRequest) {
  const context = createRequestContext(request);
  
  const authResult = await requireAuthApi();
  if (!('session' in authResult)) {
    logRequestEnd(context, 401);
    return authResult;
  }
  
  const { user } = authResult;
  
  try {
    await checkRateLimit(request, 'api');
    
    const validated = await validateBody(request, CreateBookingSchema);
    
    const booking = await BookingService.createBooking({
      eventId: validated.eventId,
      vendorId: validated.vendorId,
      amount: validated.amount,
      notes: validated.notes,
    }, user.id);
    
    Logger.business('Booking created', {
      requestId: context.requestId,
      userId: user.id,
      bookingId: booking.id,
      eventId: validated.eventId,
      vendorId: validated.vendorId,
      amount: validated.amount
    });
    
    logRequestEnd(context, 201, user.id);
    return ResponseBuilder.created(booking, 'Booking created successfully');
    
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('not found')) {
      Logger.warn('Booking creation failed - resource not found', {
        requestId: context.requestId,
        userId: user.id,
        error: error.message
      });
      logRequestEnd(context, 404, user.id);
      return createApiError(error.message, 404);
    }
    
    if (error instanceof Error && error.message.includes('already exists')) {
      Logger.warn('Booking creation failed - duplicate', {
        requestId: context.requestId,
        userId: user.id,
        error: error.message
      });
      logRequestEnd(context, 409, user.id);
      return createApiError(error.message, 409);
    }
    
    Logger.error('Failed to create booking', {
      requestId: context.requestId,
      userId: user.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    logRequestEnd(context, 500, user.id);
    return handleApiError(error, 'POST /api/v1/bookings');
  }
}