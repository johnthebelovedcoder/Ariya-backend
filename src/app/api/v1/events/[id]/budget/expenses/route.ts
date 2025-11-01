import { NextRequest } from 'next/server';
import { BudgetService } from '@/lib/budget-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// POST /api/events/[eventId]/budget/expenses - Add expense
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
    
    // Validate required fields for expense
    const requiredFields = ['budgetId', 'amount', 'description'];
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return createApiError(`${field} is required for expense`, 400);
      }
    }
    
    // Validate amount is positive
    if (typeof body.amount !== 'number' || body.amount <= 0) {
      return createApiError('Expense amount must be a positive number', 400);
    }
    
    // In a real implementation, we would update the actual spending for the budget item
    // For now, I'll call the updateActualSpending method in BudgetService
    const updatedExpense = await BudgetService.updateActualSpending(
      body.budgetId,
      eventId,
      user.id,
      body.amount
    );
    
    return createApiResponse({
      id: `${updatedExpense.id}_expense_${Date.now()}`,
      budgetId: body.budgetId,
      amount: body.amount,
      description: body.description,
      date: body.date || new Date().toISOString(),
      category: updatedExpense.category
    }, 'Expense added successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/events/[eventId]/budget/expenses');
  }
}