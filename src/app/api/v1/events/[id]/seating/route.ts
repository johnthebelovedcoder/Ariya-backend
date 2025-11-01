import { NextRequest } from 'next/server';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/events/[eventId]/seating - Get seating chart
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
    
    // In a real implementation, we would fetch the seating chart from the database
    // For now, we'll return mock data
    const seatingChart = {
      eventId,
      layoutType: 'theater', // theater, banquet, classroom, etc.
      totalTables: 8,
      totalSeats: 80,
      tables: [
        {
          id: 'table-1',
          name: 'Main Table',
          capacity: 10,
          guests: [
            { id: 'guest-1', name: 'John Doe', seatNumber: 1 },
            { id: 'guest-2', name: 'Jane Smith', seatNumber: 2 }
          ],
          section: 'front'
        },
        {
          id: 'table-2',
          name: 'Table 1',
          capacity: 8,
          guests: [
            { id: 'guest-3', name: 'Bob Johnson', seatNumber: 1 },
            { id: 'guest-4', name: 'Alice Brown', seatNumber: 2 }
          ],
          section: 'left'
        }
      ],
      unassignedGuests: [
        { id: 'guest-5', name: 'Charlie Wilson', assignedTableId: null },
        { id: 'guest-6', name: 'Diana Davis', assignedTableId: null }
      ]
    };
    
    return createApiResponse(seatingChart, 'Seating chart retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/events/[eventId]/seating');
  }
}