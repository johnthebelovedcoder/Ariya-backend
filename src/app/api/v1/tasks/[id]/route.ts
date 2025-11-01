import { NextRequest } from 'next/server';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// Helper to extract task ID from URL
function getTaskIdFromUrl(url: string): string | null {
  // Extract ID from URL - expecting format like /api/tasks/[id]
  const match = url.match(/\/api\/tasks\/([^\/\?]+)/);
  return match ? match[1] : null;
}

// GET /api/tasks/[id] - Get specific task
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const taskId = getTaskIdFromUrl(request.url);
    
    if (!taskId) {
      return createApiError('Task ID is required', 400);
    }
    
    // Placeholder implementation
    return createApiResponse({
      id: taskId,
      title: 'Sample Task',
      description: 'This is a sample task for demonstration',
      status: 'pending',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      assignedTo: user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }, 'Task retrieved successfully (placeholder implementation)');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/tasks/[id]');
  }
}

// PUT /api/tasks/[id] - Update task
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const taskId = getTaskIdFromUrl(request.url);
    
    if (!taskId) {
      return createApiError('Task ID is required', 400);
    }
    
    const body = await request.json();
    
    // Placeholder implementation
    return createApiResponse({
      id: taskId,
      title: body.title,
      description: body.description,
      status: body.status || 'pending',
      dueDate: body.dueDate,
      assignedTo: body.assignedTo || user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }, 'Task updated successfully (placeholder implementation)');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/tasks/[id]');
  }
}

// DELETE /api/tasks/[id] - Delete task
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const taskId = getTaskIdFromUrl(request.url);
    
    if (!taskId) {
      return createApiError('Task ID is required', 400);
    }
    
    // Placeholder implementation
    return createApiResponse(null, 'Task deleted successfully (placeholder implementation)', 204);
  } catch (error: any) {
    return handleApiError(error, 'DELETE /api/tasks/[id]');
  }
}