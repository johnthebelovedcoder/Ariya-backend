import { NextRequest } from 'next/server';
import { EnhancedAIService } from '@/lib/enhanced-ai-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/ai/budget-breakdown - Get visual budget breakdown
export async function GET(request: NextRequest) {
  try {
    await requireAuthApi();
    
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const eventType = searchParams.get('eventType') || 'wedding';
    const totalBudget = parseFloat(searchParams.get('totalBudget') || '5000000');
    
    if (!eventId && !eventType) {
      return createApiError('Either eventId or eventType is required', 400);
    }
    
    if (isNaN(totalBudget) || totalBudget <= 0) {
      return createApiError('totalBudget must be a positive number', 400);
    }
    
    const budgetBreakdown = await EnhancedAIService.getBudgetBreakdown({
      eventType: eventType,
      totalBudget: totalBudget,
      eventId: eventId || undefined
    });
    
    return createApiResponse(budgetBreakdown, 'Budget breakdown retrieved successfully');
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/ai/budget-breakdown');
  }
}