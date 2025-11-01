import { NextRequest } from 'next/server';
import { BudgetService } from '@/lib/budget-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// Helper to extract ID from URL
function getBudgetIdFromUrl(url: string): string | null {
  // Extract ID from URL - expecting format like /api/budgets/[id]
  const match = url.match(/\/api\/budgets\/([^\/\?]+)/);
  return match ? match[1] : null;
}

// GET /api/budgets/[id] - Get budget item by ID
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const budgetId = getBudgetIdFromUrl(request.url);
    
    if (!budgetId) {
      return createApiError('Budget ID is required', 400);
    }
    
    const budget = await BudgetService.getBudgetById(budgetId, user.id);
    
    if (!budget) {
      return createApiError('Budget item not found or you do not have permission', 404);
    }
    
    return createApiResponse(budget, 'Budget item retrieved successfully');
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/budgets/[id]');
  }
}

// PUT /api/budgets/[id] - Update a budget item
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const budgetId = getBudgetIdFromUrl(request.url);
    
    if (!budgetId) {
      return createApiError('Budget ID is required', 400);
    }
    
    const body = await request.json();
    
    const budget = await BudgetService.updateBudget(budgetId, user.id, {
      allocated: body.allocated,
      actual: body.actual,
      notes: body.notes
    });
    
    return createApiResponse(budget, 'Budget item updated successfully');
  } catch (error: unknown) {
    return handleApiError(error, 'PUT /api/budgets/[id]');
  }
}

// DELETE /api/budgets/[id] - Delete a budget item
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const budgetId = getBudgetIdFromUrl(request.url);
    
    if (!budgetId) {
      return createApiError('Budget ID is required', 400);
    }
    
    await BudgetService.deleteBudget(budgetId, user.id);
    
    return createApiResponse(null, 'Budget item deleted successfully', 204);
  } catch (error: unknown) {
    return handleApiError(error, 'DELETE /api/budgets/[id]');
  }
}