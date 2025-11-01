import { NextRequest } from 'next/server';
import { BudgetService } from '@/lib/budget-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/budgets - Get all budget items for an event
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (!eventId) {
      return createApiError('eventId is required', 400);
    }
    
    const result = await BudgetService.getEventBudgets(eventId, user.id, page, limit);
    
    return createApiResponse(result, 'Budget items retrieved successfully');
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/budgets');
  }
}

// POST /api/budgets - Create a new budget item
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['eventId', 'category', 'allocated'];
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
    
    const budget = await BudgetService.createBudget({
      eventId: body.eventId,
      category: body.category,
      allocated: body.allocated,
      notes: body.notes
    }, user.id);
    
    return createApiResponse(budget, 'Budget item created successfully', 201);
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/budgets');
  }
}