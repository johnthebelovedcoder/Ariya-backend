import { NextRequest } from 'next/server';
import { EnhancedAIService } from '@/lib/enhanced-ai-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// POST /api/ai/budget-allocate - Get AI budget allocation across categories
export async function POST(request: NextRequest) {
  try {
    await requireAuthApi();
    
    const body = await request.json();
    
    // Validate required fields for budget allocation
    const requiredFields = ['budget', 'eventType'];
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return createApiError(`${field} is required for budget allocation`, 400);
      }
    }
    
    if (typeof body.budget !== 'number' || body.budget <= 0) {
      return createApiError('budget must be a positive number', 400);
    }
    
    const budgetAllocation = await EnhancedAIService.getBudgetAllocation(
      body.budget,
      body.eventType
    );
    
    return createApiResponse(budgetAllocation, 'Budget allocation generated successfully');
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/ai/budget-allocate');
  }
}