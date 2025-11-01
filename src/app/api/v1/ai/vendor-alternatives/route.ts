import { NextRequest } from 'next/server';
import { EnhancedAIService } from '@/lib/enhanced-ai-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// POST /api/ai/vendor-alternatives - Get alternative vendor suggestions
export async function POST(request: NextRequest) {
  try {
    await requireAuthApi();
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['currentVendorId', 'category'];
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return createApiError(`${field} is required for vendor alternatives`, 400);
      }
    }
    
    const vendorAlternatives = await EnhancedAIService.getVendorAlternatives({
      currentVendorId: body.currentVendorId,
      category: body.category,
      budget: body.budget,
      location: body.location,
      eventDate: body.eventDate ? new Date(body.eventDate) : undefined,
      preferredFeatures: body.preferredFeatures
    });
    
    return createApiResponse(vendorAlternatives, 'Vendor alternatives generated successfully');
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/ai/vendor-alternatives');
  }
}