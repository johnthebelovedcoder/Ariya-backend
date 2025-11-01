import { NextRequest } from 'next/server';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// PUT /api/events/[eventId]/seating/tables/[tableId] - Update table
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; tableId: string } }
) {
  try {
    const { id: eventId, tableId } = params;
    
    if (!eventId || !tableId) {
      return createApiError('Event ID and Table ID are required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    // Validate capacity if provided
    if (body.capacity !== undefined && (typeof body.capacity !== 'number' || body.capacity <= 0)) {
      return createApiError('Capacity must be a positive number', 400);
    }
    
    // In a real implementation, we would update the table in the database
    // For now, we'll return mock data
    const updatedTable = {
      id: tableId,
      eventId,
      name: body.name || 'Updated Table Name',
      capacity: body.capacity || 8,
      section: body.section || 'general',
      position: body.position || { x: 0, y: 0 },
      guests: body.guests || [],
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      updatedAt: new Date()
    };
    
    return createApiResponse(updatedTable, 'Table updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/events/[eventId]/seating/tables/[tableId]');
  }
}

// DELETE /api/events/[eventId]/seating/tables/[tableId] - Delete table
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; tableId: string } }
) {
  try {
    const { id: eventId, tableId } = params;
    
    if (!eventId || !tableId) {
      return createApiError('Event ID and Table ID are required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // In a real implementation, we would delete the table from the database
    // For now, we'll return a success response
    
    return createApiResponse(null, 'Table deleted successfully');
  } catch (error: any) {
    return handleApiError(error, 'DELETE /api/events/[eventId]/seating/tables/[tableId]');
  }
}