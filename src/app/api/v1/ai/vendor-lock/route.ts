import { NextRequest } from 'next/server';
import { EnhancedAIService } from '@/lib/enhanced-ai-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// POST /api/ai/vendor-lock - Lock in AI-recommended vendor to budget
export async function POST(request: NextRequest) {
  try {
    await requireAuthApi();
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['vendorId', 'eventId', 'category'];
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return createApiError(`${field} is required for vendor lock`, 400);
      }
    }
    
    const lockResult = await EnhancedAIService.lockVendorToBudget({
      vendorId: body.vendorId,
      eventId: body.eventId,
      category: body.category,
      estimatedCost: body.estimatedCost,
      budgetAllocation: body.budgetAllocation
    });
    
    return createApiResponse(lockResult, 'Vendor locked to budget successfully');
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/ai/vendor-lock');
  }
}