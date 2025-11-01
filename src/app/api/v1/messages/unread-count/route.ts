import { NextRequest } from 'next/server';
import { MessageService } from '@/lib/message-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/messages/unread-count - Get unread message count
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // In a real implementation, we would fetch the unread message count from the database
    // For now, return mock data
    const unreadCountResult = {
      userId: user.id,
      totalUnread: 5,
      conversations: {
        unreadConversations: 3,
        totalConversations: 12
      },
      byType: {
        direct: 3,
        group: 2
      },
      lastUpdated: new Date()
    };
    
    return createApiResponse(unreadCountResult, 'Unread message count retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/messages/unread-count');
  }
}