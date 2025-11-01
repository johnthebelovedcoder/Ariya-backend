import { NextRequest } from 'next/server';
import { EnhancedAIService } from '@/lib/enhanced-ai-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// POST /api/ai/event-ideas - Generate event ideas based on user input
export async function POST(request: NextRequest) {
  try {
    await requireAuthApi();
    
    const body = await request.json();
    
    const eventIdeaRequest = {
      eventType: body.eventType,
      guestCount: body.guestCount,
      budget: body.budget,
      location: body.location,
      theme: body.theme,
      interests: body.interests
    };
    
    const ideas = await EnhancedAIService.generateEventIdeas(eventIdeaRequest);
    
    return createApiResponse(ideas, 'Event ideas generated successfully');
  } catch (error: any) {
    return handleApiError(error, 'POST /api/ai/event-ideas');
  }
}