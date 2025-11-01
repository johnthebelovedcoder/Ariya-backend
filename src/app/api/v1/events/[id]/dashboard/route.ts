import { NextRequest } from 'next/server';
import { EventService } from '@/lib/event-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/events/[eventId]/dashboard - Get event dashboard overview
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
    const event = await EventService.getEventById(eventId);
    if (!event || event.userId !== user.id) {
      return createApiError('Event not found or you do not have permission', 404);
    }
    
    // In a real implementation, this would fetch comprehensive event statistics
    // For now, return mock dashboard data
    const dashboardData = {
      event: {
        id: event.id,
        name: event.name,
        type: event.type,
        date: event.date,
        location: event.location,
        status: event.status,
        budget: event.budget,
        guestCount: event.guestCount
      },
      stats: {
        totalGuests: 45,
        attendingGuests: 32,
        notAttendingGuests: 8,
        maybeGuests: 5,
        totalVendors: 5,
        confirmedVendors: 4,
        pendingVendors: 1,
        totalBudget: event.budget,
        spentBudget: event.budget * 0.65, // 65% of budget spent
        remainingBudget: event.budget * 0.35,
        daysToEvent: Math.ceil((new Date(event.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      },
      recentActivity: [
        {
          id: 'act-1',
          type: 'GUEST_RSVP',
          message: 'John Doe responded with "Yes"',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          severity: 'info'
        },
        {
          id: 'act-2',
          type: 'VENDOR_BOOKED',
          message: 'Elegant Caterers booking confirmed',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          severity: 'success'
        },
        {
          id: 'act-3',
          type: 'TASK_COMPLETED',
          message: 'Finalized guest list',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          severity: 'info'
        }
      ],
      upcomingTasks: [
        {
          id: 'task-1',
          title: 'Confirm final headcount with caterer',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
          priority: 'high',
          completed: false
        },
        {
          id: 'task-2',
          title: 'Send final seating chart to venue',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          priority: 'medium',
          completed: false
        }
      ],
      vendorReminders: [
        {
          id: 'rem-1',
          vendorName: 'Elegant Caterers',
          message: 'Menu tasting scheduled for tomorrow',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          priority: 'high'
        }
      ],
      budgetBreakdown: {
        venue: { allocated: event.budget * 0.3, spent: event.budget * 0.25 },
        catering: { allocated: event.budget * 0.4, spent: event.budget * 0.35 },
        decoration: { allocated: event.budget * 0.15, spent: event.budget * 0.1 },
        entertainment: { allocated: event.budget * 0.1, spent: event.budget * 0.05 },
        other: { allocated: event.budget * 0.05, spent: event.budget * 0.02 }
      }
    };
    
    return createApiResponse(dashboardData, 'Event dashboard data retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/events/[eventId]/dashboard');
  }
}