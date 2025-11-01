import { NextRequest } from 'next/server';
import { BudgetService } from '@/lib/budget-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// POST /api/events/[eventId]/budget/categories - Create budget category
export async function POST(
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
    const requiredFields = ['category', 'allocated'];
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    // Validate allocated amount is positive
    if (typeof body.allocated !== 'number' || body.allocated <= 0) {
      return createApiError('Allocated amount must be a positive number', 400);
    }
    
    if (typeof body.category !== 'string' || body.category.trim().length === 0) {
      return createApiError('Category must be a non-empty string', 400);
    }
    
    // Use the existing BudgetService to create a new budget item (which serves as a category)
    const budget = await BudgetService.createBudget({
      eventId: eventId,
      category: body.category,
      allocated: body.allocated,
      notes: body.notes
    }, user.id);
    
    return createApiResponse(budget, 'Budget category created successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/events/[eventId]/budget/categories');
  }
}