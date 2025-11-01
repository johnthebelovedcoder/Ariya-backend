import { NextRequest } from 'next/server';
import { EnhancedAIService } from '@/lib/enhanced-ai-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/ai/cost-savings-tips - Get cost-saving recommendations
export async function GET(request: NextRequest) {
  try {
    await requireAuthApi();
    
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const eventType = searchParams.get('eventType');
    const budget = parseFloat(searchParams.get('budget') || '0');
    
    const tips = await EnhancedAIService.getCostSavingsTips({
      eventId: eventId || undefined,
      eventType: eventType || undefined,
      budget: budget > 0 ? budget : undefined
    });
    
    return createApiResponse(tips, 'Cost-saving tips retrieved successfully');
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/ai/cost-savings-tips');
  }
}