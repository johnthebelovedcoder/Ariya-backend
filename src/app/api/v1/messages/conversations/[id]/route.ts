import { NextRequest } from 'next/server';
import { MessageService } from '@/lib/message-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/messages/conversations/[conversationId] - Get conversation thread
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: conversationId } = params;
    
    if (!conversationId) {
      return createApiError('Conversation ID is required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortOrder = searchParams.get('sortOrder') || 'asc'; // 'asc' or 'desc'
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 50) {
      return createApiError('Invalid pagination parameters. Limit must be between 1-50', 400);
    }
    
    // Get the conversation thread
    const result = await MessageService.getConversationThread(
      conversationId,
      user.id,
      page,
      limit,
      sortOrder
    );
    
    return createApiResponse(result, 'Conversation thread retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/messages/conversations/[conversationId]');
  }
}

// POST /api/messages/conversations/[conversationId]/messages - Send message to conversation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: conversationId } = params;
    
    if (!conversationId) {
      return createApiError('Conversation ID is required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.content) {
      return createApiError('content is required', 400);
    }
    
    // Validate content length
    if (typeof body.content !== 'string' || body.content.trim().length === 0) {
      return createApiError('content is required and cannot be empty', 400);
    }
    
    if (body.content.length > 10000) { // Max 10k characters
      return createApiError('Message content is too long (max 10000 characters)', 400);
    }
    
    // Send message to the conversation
    const message = await MessageService.sendMessageToConversation({
      conversationId,
      content: body.content,
      senderId: user.id,
    });
    
    return createApiResponse(message, 'Message sent to conversation successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/messages/conversations/[conversationId]/messages');
  }
}