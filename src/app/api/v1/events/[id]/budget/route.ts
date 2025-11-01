import { NextRequest } from 'next/server';
import { BudgetService } from '@/lib/budget-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/events/[id]/budget - Get budget overview for an event
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
    
    // Get budget summary for the event
    const budgetSummary = await BudgetService.getBudgetSummary(eventId, user.id);
    
    if (!budgetSummary) {
      return createApiError('Event not found or you do not have permission', 404);
    }
    
    return createApiResponse(budgetSummary, 'Event budget overview retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/events/[id]/budget');
  }
}