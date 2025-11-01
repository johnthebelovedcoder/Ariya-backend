import { NextRequest } from 'next/server';
import { BudgetService } from '@/lib/budget-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// Helper to extract IDs from URL
function getIdsFromUrl(url: string): { eventId: string | null; categoryId: string | null } {
  // Extract eventId from URL - pattern: /api/events/[eventId]/budget/categories/[categoryId]
  const eventMatch = url.match(/\/api\/events\/([^\/\?]+)/);
  const categoryMatch = url.match(/\/api\/events\/[^\/]+\/budget\/categories\/([^\/\?]+)/);
  
  return {
    eventId: eventMatch ? eventMatch[1] : null,
    categoryId: categoryMatch ? categoryMatch[1] : null
  };
}

// PUT /api/events/[eventId]/budget/categories/[categoryId] - Update budget category
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } } // params.id is the eventId
) {
  try {
    const { id: eventId } = params; // This is the eventId from /api/events/[id]/budget/...
    const { eventId: extractedEventId, categoryId } = getIdsFromUrl(request.url);
    
    // Use the extracted event ID if available, otherwise fall back to param
    const finalEventId = extractedEventId || eventId;
    
    if (!finalEventId || !categoryId) {
      return createApiError('Event ID and Category/Budget ID are required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    // Validate that the budget item exists and belongs to the user
    const existingBudget = await BudgetService.getBudgetById(categoryId, user.id);
    if (!existingBudget) {
      return createApiError('Budget category not found or you do not have permission', 404);
    }
    
    // Only update if the budget belongs to the correct event
    if (existingBudget.eventId !== finalEventId) {
      return createApiError('Budget category does not belong to this event', 403);
    }
    
    const updatedBudget = await BudgetService.updateBudget(categoryId, user.id, {
      allocated: body.allocated,
      actual: body.actual,
      notes: body.notes
    });
    
    return createApiResponse(updatedBudget, 'Budget category updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/events/[eventId]/budget/categories/[categoryId]');
  }
}

// DELETE /api/events/[eventId]/budget/categories/[categoryId] - Delete budget category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: eventId } = params;
    const { eventId: extractedEventId, categoryId } = getIdsFromUrl(request.url);
    
    const finalEventId = extractedEventId || eventId;
    
    if (!finalEventId || !categoryId) {
      return createApiError('Event ID and Category/Budget ID are required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Validate that the budget item exists and belongs to the user
    const existingBudget = await BudgetService.getBudgetById(categoryId, user.id);
    if (!existingBudget) {
      return createApiError('Budget category not found or you do not have permission', 404);
    }
    
    // Only update if the budget belongs to the correct event
    if (existingBudget.eventId !== finalEventId) {
      return createApiError('Budget category does not belong to this event', 403);
    }
    
    await BudgetService.deleteBudget(categoryId, user.id);
    
    return createApiResponse(null, 'Budget category deleted successfully', 204);
  } catch (error: any) {
    return handleApiError(error, 'DELETE /api/events/[eventId]/budget/categories/[categoryId]');
  }
}