import { NextRequest } from 'next/server';
import { MessageService } from '@/lib/message-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/messages/[id] - Get a specific message by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return createApiError('Message ID is required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const message = await MessageService.getMessageById(id, user.id);
    
    if (!message) {
      return createApiError('Message not found or you do not have permission to access it', 404);
    }
    
    return createApiResponse(message, 'Message retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/messages/[id]');
  }
}

// PUT /api/messages/[id] - Update a message (e.g., mark as read)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return createApiError('Message ID is required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    const message = await MessageService.updateMessage(id, user.id, {
      isRead: body.isRead,
    });
    
    return createApiResponse(message, 'Message updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/messages/[id]');
  }
}

// DELETE /api/messages/[id] - Delete a message
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return createApiError('Message ID is required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    await MessageService.deleteMessage(id, user.id);
    
    return createApiResponse(null, 'Message deleted successfully');
  } catch (error: any) {
    return handleApiError(error, 'DELETE /api/messages/[id]');
  }
}