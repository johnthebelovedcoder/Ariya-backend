import { NextRequest } from 'next/server';
import { EventService } from '@/lib/event-service';
import { requireAuthApi, createApiResponse, handleApiError } from '@/lib/api-utils';
import { CreateEventSchema } from '@/lib/validation-schemas';
import { validateBody } from '@/middleware/validate-request';
import { checkRateLimit } from '@/middleware/rate-limit-check';
import { createRequestContext, logRequestEnd, logRequestError } from '@/middleware/request-context';
import { parsePagination, createPaginatedResponse } from '@/lib/pagination-utils';
import { ResponseBuilder } from '@/lib/response-builder';
import Logger from '@/lib/logger-service';

/**
 * GET /api/v1/events
 * Get all events for authenticated user with pagination
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
    
    const result = await EventService.getUserEvents(user.id, page, limit);
    
    const response = createPaginatedResponse(
      result.events,
      result.total,
      page,
      limit
    );
    
    Logger.debug('Events retrieved', {
      requestId: context.requestId,
      userId: user.id,
      count: result.events.length,
      total: result.total
    });
    
    logRequestEnd(context, 200, user.id);
    return ResponseBuilder.paginated(response, 'Events retrieved successfully');
    
  } catch (error: unknown) {
    Logger.error('Failed to retrieve events', {
      requestId: context.requestId,
      userId: user.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    logRequestEnd(context, 500, user.id);
    return handleApiError(error, 'GET /api/v1/events');
  }
}

/**
 * POST /api/v1/events
 * Create a new event
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
    
    const validated = await validateBody(request, CreateEventSchema);
    
    const event = await EventService.createEvent({
      userId: user.id,
      ...validated,
      date: new Date(validated.date),
    });
    
    Logger.business('Event created', {
      requestId: context.requestId,
      userId: user.id,
      eventId: event.id,
      eventName: event.name,
      budget: event.budget,
      guestCount: event.guestCount
    });
    
    logRequestEnd(context, 201, user.id);
    return ResponseBuilder.created(event, 'Event created successfully');
    
  } catch (error: unknown) {
    Logger.error('Failed to create event', {
      requestId: context.requestId,
      userId: user.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    logRequestEnd(context, 500, user.id);
    return handleApiError(error, 'POST /api/v1/events');
  }
}