import { NextRequest } from 'next/server';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/events/[eventId]/tasks - List all tasks for event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: eventId } = params;
    
    if (!eventId) {
      return createApiError('Event ID is required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Verify user has access to the event
    // In a real implementation, we would check if the event belongs to the user
    const eventExists = true; // Placeholder
    
    if (!eventExists) {
      return createApiError('Event not found or you do not have permission', 404);
    }
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || undefined; // 'pending', 'completed', 'overdue'
    const priority = searchParams.get('priority') || undefined; // 'low', 'medium', 'high'
    
    // In a real implementation, this would fetch tasks from a database
    // For now, return mock task data
    const mockTasks = [
      {
        id: 'task-1',
        eventId,
        title: 'Book venue',
        description: 'Reserve the main event venue and confirm the date',
        status: 'completed',
        priority: 'high',
        dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        assignedTo: user.id,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'task-2',
        eventId,
        title: 'Send invitations',
        description: 'Design and send out invitations to all guests',
        status: 'pending',
        priority: 'medium',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
        assignedTo: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'task-3',
        eventId,
        title: 'Confirm catering menu',
        description: 'Finalize the menu with the catering service',
        status: 'pending',
        priority: 'high',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
        assignedTo: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    // Apply filters
    let filteredTasks = mockTasks;
    
    if (status) {
      filteredTasks = filteredTasks.filter(task => task.status === status);
    }
    
    if (priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === priority);
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedTasks = filteredTasks.slice(startIndex, startIndex + limit);
    
    return createApiResponse({
      tasks: paginatedTasks,
      pagination: {
        page,
        limit,
        total: filteredTasks.length,
        pages: Math.ceil(filteredTasks.length / limit)
      },
      filters: {
        status,
        priority
      }
    }, 'Event tasks retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/events/[eventId]/tasks');
  }
}

// POST /api/events/[eventId]/tasks - Create task
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: eventId } = params;
    
    if (!eventId) {
      return createApiError('Event ID is required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['title'];
    for (const field of requiredFields) {
      if (!body[field] || typeof body[field] !== 'string' || body[field].trim().length === 0) {
        return createApiError(`${field} is required and cannot be empty`, 400);
      }
    }
    
    // Validate optional fields
    if (body.description && typeof body.description !== 'string') {
      return createApiError('Description must be a string', 400);
    }
    
    const validStatuses = ['pending', 'completed', 'overdue'];
    if (body.status && !validStatuses.includes(body.status)) {
      return createApiError(`Status must be one of: ${validStatuses.join(', ')}`, 400);
    }
    
    const validPriorities = ['low', 'medium', 'high'];
    if (body.priority && !validPriorities.includes(body.priority)) {
      return createApiError(`Priority must be one of: ${validPriorities.join(', ')}`, 400);
    }
    
    if (body.dueDate) {
      const dueDate = new Date(body.dueDate);
      if (isNaN(dueDate.getTime())) {
        return createApiError('Invalid due date format', 400);
      }
    }
    
    // Create task
    const newTask = {
      id: `task_${Date.now()}`,
      eventId,
      title: body.title.trim(),
      description: body.description ? body.description.trim() : undefined,
      status: body.status || 'pending',
      priority: body.priority || 'medium',
      dueDate: body.dueDate ? new Date(body.dueDate).toISOString() : undefined,
      assignedTo: body.assignedTo || user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return createApiResponse(newTask, 'Task created successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/events/[eventId]/tasks');
  }
}