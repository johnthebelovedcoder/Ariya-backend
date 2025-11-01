import { NextRequest } from 'next/server';
import { EnhancedAIService } from '@/lib/enhanced-ai-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// Helper to extract event type from URL
function getEventTypeFromUrl(url: string): string | null {
  // Extract eventType from URL - expecting format like /api/ai/event-themes/[eventType]
  const match = url.match(/\/api\/ai\/event-themes\/([^\/\?]+)/);
  return match ? match[1] : null;
}

// GET /api/ai/event-themes/[eventType] - Get theme suggestions for event type
export async function GET(request: NextRequest) {
  try {
    await requireAuthApi();
    
    const eventType = getEventTypeFromUrl(request.url);
    
    if (!eventType) {
      return createApiError('Event type is required', 400);
    }
    
    const themeSuggestions = await EnhancedAIService.getThemeSuggestions(eventType);
    
    return createApiResponse(themeSuggestions, 'Theme suggestions retrieved successfully');
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/ai/event-themes/[eventType]');
  }
}