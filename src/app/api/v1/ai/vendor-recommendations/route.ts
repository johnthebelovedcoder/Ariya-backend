import { NextRequest } from 'next/server';
import { EnhancedAIService } from '@/lib/enhanced-ai-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// POST /api/ai/vendor-recommendations - Get AI-recommended vendors by category/budget
export async function POST(request: NextRequest) {
  try {
    await requireAuthApi();
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['category', 'budget'];
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return createApiError(`${field} is required for vendor recommendations`, 400);
      }
    }
    
    if (typeof body.budget !== 'number' || body.budget <= 0) {
      return createApiError('budget must be a positive number', 400);
    }
    
    const vendorRecommendations = await EnhancedAIService.getVendorRecommendations({
      category: body.category,
      budget: body.budget,
      location: body.location,
      eventDate: body.eventDate ? new Date(body.eventDate) : undefined,
      eventType: body.eventType,
      preferredFeatures: body.preferredFeatures
    });
    
    return createApiResponse(vendorRecommendations, 'Vendor recommendations generated successfully');
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/ai/vendor-recommendations');
  }
}