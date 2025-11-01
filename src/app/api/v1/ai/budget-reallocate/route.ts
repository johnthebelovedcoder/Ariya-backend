import { NextRequest } from 'next/server';
import { EnhancedAIService } from '@/lib/enhanced-ai-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// PUT /api/ai/budget-reallocate - Recalculate allocation after manual adjustment
export async function PUT(request: NextRequest) {
  try {
    await requireAuthApi();
    
    const body = await request.json();
    
    // Validate required fields for budget reallocation
    const requiredFields = ['currentAllocation', 'totalBudget'];
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return createApiError(`${field} is required for budget reallocation`, 400);
      }
    }
    
    if (!Array.isArray(body.currentAllocation)) {
      return createApiError('currentAllocation must be an array', 400);
    }
    
    if (typeof body.totalBudget !== 'number' || body.totalBudget <= 0) {
      return createApiError('totalBudget must be a positive number', 400);
    }
    
    const reallocatedBudget = await EnhancedAIService.reallocateBudget(
      body.currentAllocation,
      body.totalBudget
    );
    
    return createApiResponse(reallocatedBudget, 'Budget reallocated successfully');
  } catch (error: unknown) {
    return handleApiError(error, 'PUT /api/ai/budget-reallocate');
  }
}