import { NextRequest } from 'next/server';
import { UserService } from '@/lib/user-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/users/[id]/notifications - Get user notifications
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return createApiError('User ID is required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user: requestingUser } = authResult;
    
    // Only allow user to access their own notifications
    if (requestingUser.id !== id) {
      return createApiError('You can only access your own notifications', 403);
    }
    
    // In a real implementation, we would fetch from a notifications table
    // For now, return placeholder data based on the user's activity
    const user = await UserService.getUserById(id);
    if (!user) {
      return createApiError('User not found', 404);
    }
    
    const notifications = [
      {
        id: 'notif-1',
        userId: id,
        title: 'Welcome to Ariya Events!',
        message: 'Thanks for joining our platform',
        type: 'welcome',
        read: false,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        id: 'notif-2',
        userId: id,
        title: 'Booking Confirmed',
        message: 'Your booking with Elegant Caterers has been confirmed',
        type: 'booking',
        read: true,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000) // 2 days ago
      }
    ];
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const readStatus = searchParams.get('read'); // 'read', 'unread', or 'all'
    
    let filteredNotifications = notifications;
    
    if (readStatus === 'read') {
      filteredNotifications = notifications.filter(notif => notif.read);
    } else if (readStatus === 'unread') {
      filteredNotifications = notifications.filter(notif => !notif.read);
    }
    
    return createApiResponse({
      notifications: filteredNotifications,
      total: filteredNotifications.length,
      unreadCount: notifications.filter(notif => !notif.read).length
    }, 'Notifications retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/users/[id]/notifications');
  }
}