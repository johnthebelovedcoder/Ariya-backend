import { NextRequest } from 'next/server';
import { MessageService } from '@/lib/message-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/messages/conversations - List all conversations
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 50) {
      return createApiError('Invalid pagination parameters. Limit must be between 1-50', 400);
    }
    
    // Get conversations for the user
    const result = await MessageService.getUserConversations(user.id, page, limit, unreadOnly);
    
    return createApiResponse(result, 'Conversations retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/messages/conversations');
  }
}

// POST /api/messages/conversations - Start new conversation
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['participantIds', 'initialMessage'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    // Validate participant IDs is an array
    if (!Array.isArray(body.participantIds) || body.participantIds.length === 0) {
      return createApiError('participantIds must be a non-empty array', 400);
    }
    
    // Validate initial message
    if (typeof body.initialMessage !== 'string' || body.initialMessage.trim().length === 0) {
      return createApiError('initialMessage is required and cannot be empty', 400);
    }
    
    if (body.initialMessage.length > 10000) {
      return createApiError('Initial message is too long (max 10000 characters)', 400);
    }
    
    // Ensure current user is included in participants
    if (!body.participantIds.includes(user.id)) {
      body.participantIds.push(user.id);
    }
    
    // Create conversation
    const conversation = await MessageService.createConversation({
      participantIds: body.participantIds,
      initialMessage: body.initialMessage,
      subject: body.subject
    }, user.id);
    
    return createApiResponse(conversation, 'Conversation started successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/messages/conversations');
  }
}