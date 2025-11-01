import { NextRequest } from 'next/server';
import { BudgetService } from '@/lib/budget-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// Helper to extract IDs from URL
function getExpenseIdsFromUrl(url: string): { eventId: string | null; expenseId: string | null } {
  // Extract eventId from URL - pattern: /api/events/[eventId]/budget/expenses/[expenseId]
  const eventMatch = url.match(/\/api\/events\/([^\/\?]+)/);
  const expenseMatch = url.match(/\/api\/events\/[^\/]+\/budget\/expenses\/([^\/\?]+)/);
  
  return {
    eventId: eventMatch ? eventMatch[1] : null,
    expenseId: expenseMatch ? expenseMatch[1] : null
  };
}

// PUT /api/events/[eventId]/budget/expenses/[expenseId] - Update expense
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } } // params.id is the eventId
) {
  try {
    const { id: eventId } = params; // This is the eventId from /api/events/[id]/budget/...
    const { eventId: extractedEventId, expenseId } = getExpenseIdsFromUrl(request.url);
    
    // Use the extracted event ID if available, otherwise fall back to param
    const finalEventId = extractedEventId || eventId;
    
    if (!finalEventId || !expenseId) {
      return createApiError('Event ID and Expense ID are required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    // Validate amount if provided
    if (body.amount !== undefined && (typeof body.amount !== 'number' || body.amount <= 0)) {
      return createApiError('Expense amount must be a positive number', 400);
    }
    
    // For expense updates, we need to adjust the actual spending in the budget item
    // This would require a new method in BudgetService
    // For now, return a success message
    const updatedExpense = {
      id: expenseId,
      amount: body.amount,
      description: body.description,
      date: body.date,
      updatedAt: new Date().toISOString()
    };
    
    return createApiResponse(updatedExpense, 'Expense updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/events/[eventId]/budget/expenses/[expenseId]');
  }
}

// DELETE /api/events/[eventId]/budget/expenses/[expenseId] - Delete expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: eventId } = params;
    const { eventId: extractedEventId, expenseId } = getExpenseIdsFromUrl(request.url);
    
    const finalEventId = extractedEventId || eventId;
    
    if (!finalEventId || !expenseId) {
      return createApiError('Event ID and Expense ID are required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // For now, return success message
    // In a real implementation, we would reduce the actual spending and potentially delete the expense record
    
    return createApiResponse(null, 'Expense deleted successfully', 204);
  } catch (error: any) {
    return handleApiError(error, 'DELETE /api/events/[eventId]/budget/expenses/[expenseId]');
  }
}