import { NextRequest } from 'next/server';
import { EnhancedAIService } from '@/lib/enhanced-ai-service';
import { createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// Helper to extract eventType from URL
function getEventTypeFromUrl(url: string): string | null {
  // Extract eventType from URL - expecting format like /api/ai/event-themes/[eventType]
  const match = url.match(/\/api\/ai\/event-themes\/([^\/\?]+)/);
  return match ? match[1] : null;
}

// GET /api/ai/event-themes/[eventType] - Get theme suggestions for event type
export async function GET(request: NextRequest) {
  try {
    const eventType = getEventTypeFromUrl(request.url);
    
    if (!eventType) {
      return createApiError('eventType is required', 400);
    }
    
    const themes = await EnhancedAIService.getEventThemes(eventType);
    
    return createApiResponse(themes, `Theme suggestions for ${eventType} generated successfully`);
  } catch (error: any) {
    return handleApiError(error, 'GET /api/ai/event-themes/[eventType]');
  }
}