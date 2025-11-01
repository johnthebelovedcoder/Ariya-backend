import { NextRequest } from 'next/server';
import { MessageService } from '@/lib/message-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// POST /api/messages/mark-as-read - Mark all messages from a sender as read
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.senderId) {
      return createApiError('senderId is required', 400);
    }
    
    await MessageService.markMessagesAsRead(body.senderId, user.id);
    
    return createApiResponse(null, 'Messages marked as read successfully');
  } catch (error: any) {
    return handleApiError(error, 'POST /api/messages/mark-as-read');
  }
}