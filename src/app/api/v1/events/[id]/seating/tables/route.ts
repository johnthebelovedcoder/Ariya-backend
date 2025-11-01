import { NextRequest } from 'next/server';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// POST /api/events/[eventId]/seating/tables - Create table
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
    const requiredFields = ['name', 'capacity'];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    // Validate capacity
    if (typeof body.capacity !== 'number' || body.capacity <= 0) {
      return createApiError('Capacity must be a positive number', 400);
    }
    
    // In a real implementation, we would create the table in the database
    // For now, we'll return mock data
    const newTable = {
      id: `table_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventId,
      name: body.name,
      capacity: body.capacity,
      section: body.section || 'general',
      position: body.position || { x: 0, y: 0 }, // For visual layout
      guests: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return createApiResponse(newTable, 'Table created successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/events/[eventId]/seating/tables');
  }
}