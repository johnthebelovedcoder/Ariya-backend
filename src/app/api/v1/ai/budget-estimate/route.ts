import { NextRequest } from 'next/server';
import { EnhancedAIService } from '@/lib/enhanced-ai-service';
import { requireAuthApi, handleApiError } from '@/lib/api-utils';
import { AIBudgetEstimateSchema } from '@/lib/validation-schemas';
import { validateBody } from '@/middleware/validate-request';
import { checkRateLimit } from '@/middleware/rate-limit-check';
import { createRequestContext, logRequestEnd } from '@/middleware/request-context';
import { ResponseBuilder } from '@/lib/response-builder';
import Logger from '@/lib/logger-service';

/**
 * POST /api/v1/ai/budget-estimate
 * Get AI-powered budget estimate for an event
 * 
 * IMPORTANT: This endpoint uses AI services which are expensive.
 * Rate limiting is critical to prevent abuse.
 */
export async function POST(request: NextRequest) {
  const context = createRequestContext(request);
  
  const authResult = await requireAuthApi();
  if (!('session' in authResult)) {
    logRequestEnd(context, 401);
    return authResult;
  }
  
  const { user } = authResult;
  
  try {
    // Strict rate limiting for AI endpoints (expensive operations)
    await checkRateLimit(request, 'api');
    
    const validated = await validateBody(request, AIBudgetEstimateSchema);
    
    Logger.info('AI budget estimate requested', {
      requestId: context.requestId,
      userId: user.id,
      eventType: validated.eventType,
      guestCount: validated.guestCount,
      location: validated.location
    });
    
    const startTime = Date.now();
    const budgetEstimate = await EnhancedAIService.getBudgetEstimate({
      eventType: validated.eventType,
      guestCount: validated.guestCount,
      location: validated.location,
      specialRequirements: validated.specialRequirements,
    });
    const aiDuration = Date.now() - startTime;
    
    Logger.business('AI budget estimate generated', {
      requestId: context.requestId,
      userId: user.id,
      eventType: validated.eventType,
      guestCount: validated.guestCount,
      estimatedBudget: budgetEstimate.totalEstimate,
      aiDuration: `${aiDuration}ms`
    });
    
    logRequestEnd(context, 200, user.id);
    return ResponseBuilder.success(budgetEstimate, 'Budget estimate generated successfully');
    
  } catch (error: unknown) {
    Logger.error('AI budget estimate failed', {
      requestId: context.requestId,
      userId: user.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    logRequestEnd(context, 500, user.id);
    return handleApiError(error, 'POST /api/v1/ai/budget-estimate');
  }
}