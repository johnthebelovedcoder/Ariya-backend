import { NextRequest } from 'next/server';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// Helper to extract task ID from URL
function getTaskIdFromUrl(url: string): string | null {
  // Extract taskId from URL - pattern: /api/events/[eventId]/tasks/[taskId]
  const match = url.match(/\/api\/events\/[^\/]+\/tasks\/([^\/\?]+)/);
  return match ? match[1] : null;
}

// GET /api/events/[eventId]/tasks/[taskId] - Get specific task
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: eventId } = params;
    const taskId = getTaskIdFromUrl(request.url);
    
    if (!eventId || !taskId) {
      return createApiError('Event ID and Task ID are required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Verify user has access to the event
    // In a real implementation, we would check if the event belongs to the user
    const eventExists = true; // Placeholder
    
    if (!eventExists) {
      return createApiError('Event not found or you do not have permission', 404);
    }
    
    // In a real implementation, this would fetch the task from a database
    // For now, return mock task data
    const mockTask = {
      id: taskId,
      eventId,
      title: 'Sample Task',
      description: 'This is a sample task description for demonstration purposes',
      status: 'pending',
      priority: 'medium',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
      assignedTo: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subtasks: [
        {
          id: 'subtask-1',
          taskId: taskId,
          title: 'Research vendors',
          completed: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 'subtask-2',
          taskId: taskId,
          title: 'Get quotes',
          completed: true,
          createdAt: new Date().toISOString()
        }
      ],
      comments: [
        {
          id: 'comment-1',
          taskId: taskId,
          userId: user.id,
          content: 'This is an important task that needs to be completed soon',
          createdAt: new Date().toISOString()
        }
      ]
    };
    
    return createApiResponse(mockTask, 'Task retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/events/[eventId]/tasks/[taskId]');
  }
}

// PUT /api/events/[eventId]/tasks/[taskId] - Update task
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: eventId } = params;
    const taskId = getTaskIdFromUrl(request.url);
    
    if (!eventId || !taskId) {
      return createApiError('Event ID and Task ID are required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Verify user has access to the event
    const eventExists = true; // Placeholder
    
    if (!eventExists) {
      return createApiError('Event not found or you do not have permission', 404);
    }
    
    const body = await request.json();
    
    // Validate update fields
    const validFields = ['title', 'description', 'status', 'priority', 'dueDate', 'assignedTo'];
    const invalidFields = Object.keys(body).filter(field => !validFields.includes(field));
    
    if (invalidFields.length > 0) {
      return createApiError(`Invalid fields: ${invalidFields.join(', ')}. Valid fields are: ${validFields.join(', ')}`, 400);
    }
    
    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim().length === 0) {
        return createApiError('Title must be a non-empty string', 400);
      }
    }
    
    if (body.description !== undefined && typeof body.description !== 'string') {
      return createApiError('Description must be a string', 400);
    }
    
    const validStatuses = ['pending', 'completed', 'overdue'];
    if (body.status !== undefined && !validStatuses.includes(body.status)) {
      return createApiError(`Status must be one of: ${validStatuses.join(', ')}`, 400);
    }
    
    const validPriorities = ['low', 'medium', 'high'];
    if (body.priority !== undefined && !validPriorities.includes(body.priority)) {
      return createApiError(`Priority must be one of: ${validPriorities.join(', ')}`, 400);
    }
    
    if (body.dueDate !== undefined) {
      const dueDate = new Date(body.dueDate);
      if (isNaN(dueDate.getTime())) {
        return createApiError('Invalid due date format', 400);
      }
    }
    
    // Update task
    const updatedTask = {
      id: taskId,
      eventId,
      title: body.title !== undefined ? body.title.trim() : 'Sample Task',
      description: body.description,
      status: body.status || 'pending',
      priority: body.priority || 'medium',
      dueDate: body.dueDate,
      assignedTo: body.assignedTo || user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return createApiResponse(updatedTask, 'Task updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/events/[eventId]/tasks/[taskId]');
  }
}

// DELETE /api/events/[eventId]/tasks/[taskId] - Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: eventId } = params;
    const taskId = getTaskIdFromUrl(request.url);
    
    if (!eventId || !taskId) {
      return createApiError('Event ID and Task ID are required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Verify user has access to the event
    const eventExists = true; // Placeholder
    
    if (!eventExists) {
      return createApiError('Event not found or you do not have permission', 404);
    }
    
    // In a real implementation, this would delete the task from a database
    // For now, return success response
    
    return createApiResponse(null, 'Task deleted successfully', 204);
  } catch (error: any) {
    return handleApiError(error, 'DELETE /api/events/[eventId]/tasks/[taskId]');
  }
}