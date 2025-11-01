import { NextRequest } from 'next/server';
import { EnhancedAIService } from '@/lib/enhanced-ai-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// POST /api/ai/optimize-budget - Get optimization suggestions based on current plan
export async function POST(request: NextRequest) {
  try {
    await requireAuthApi();
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.currentPlan) {
      return createApiError('currentPlan is required for budget optimization', 400);
    }
    
    const optimizationResult = await EnhancedAIService.optimizeBudget({
      currentPlan: body.currentPlan,
      budget: body.budget,
      savingsTarget: body.savingsTarget
    });
    
    return createApiResponse(optimizationResult, 'Budget optimization suggestions retrieved successfully');
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/ai/optimize-budget');
  }
}