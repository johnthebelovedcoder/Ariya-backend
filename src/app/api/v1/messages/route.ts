import { NextRequest } from 'next/server';
import { MessageService } from '@/lib/message-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/messages - Get messages for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const isRead = searchParams.get('isRead');
    const otherUserId = searchParams.get('otherUserId'); // For getting messages between two users
    const type = searchParams.get('type'); // 'sent' or 'received'
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return createApiError('Invalid pagination parameters', 400);
    }
    
    let result;
    
    if (otherUserId) {
      // Get messages between current user and another user
      result = await MessageService.getMessagesBetweenUsers(
        user.id,
        otherUserId,
        page,
        limit
      );
    } else if (type === 'sent') {
      // Get messages sent by the user
      result = await MessageService.getUserSentMessages(
        user.id,
        page,
        limit
      );
    } else {
      // Get messages received by the user (default)
      const isReadParam = isRead !== null ? isRead === 'true' : undefined;
      result = await MessageService.getUserMessages(
        user.id,
        page,
        limit,
        isReadParam
      );
    }
    
    return createApiResponse(result, 'Messages retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/messages');
  }
}

// POST /api/messages - Send a new message
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['receiverId', 'content'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    // Validate content length
    if (body.content.length > 10000) { // Max 10k characters
      return createApiError('Message content is too long', 400);
    }
    
    const message = await MessageService.sendMessage({
      receiverId: body.receiverId,
      content: body.content,
    }, user.id);
    
    return createApiResponse(message, 'Message sent successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/messages');
  }
}