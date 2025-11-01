import { NextRequest } from 'next/server';
import { EnhancedAIService } from '@/lib/enhanced-ai-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// POST /api/ai/budget-estimate - Get AI budget estimate
export async function POST(request: NextRequest) {
  try {
    await requireAuthApi();
    
    const body = await request.json();
    
    // Validate required fields for budget estimation
    const requiredFields = ['eventType', 'guestCount'];
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return createApiError(`${field} is required for budget estimation`, 400);
      }
    }
    
    const budgetEstimate = await EnhancedAIService.getBudgetEstimate({
      eventType: body.eventType,
      guestCount: body.guestCount,
      location: body.location,
      specialRequirements: body.specialRequirements,
    });
    
    return createApiResponse(budgetEstimate, 'Budget estimate generated successfully');
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/ai/budget-estimate');
  }
}