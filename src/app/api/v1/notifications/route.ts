import { NextRequest } from 'next/server';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/notifications/settings - Get notification preferences
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // In a real implementation, this would fetch from a notification preferences table
    // For now, return default settings
    const defaultSettings = {
      userId: user.id,
      emailNotifications: {
        bookingUpdates: true,
        eventReminders: true,
        marketing: false,
        securityAlerts: true
      },
      pushNotifications: {
        bookingUpdates: true,
        eventReminders: true,
        newMessages: true,
        promotional: false
      },
      smsNotifications: {
        bookingUpdates: false,
        eventReminders: false,
        criticalAlerts: true
      },
      notificationSchedule: {
        startTime: '08:00',
        endTime: '22:00',
        timezone: user.timezone || 'Africa/Lagos'
      },
      updatedAt: new Date().toISOString()
    };
    
    return createApiResponse(defaultSettings, 'Notification preferences retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/notifications/settings');
  }
}

// PUT /api/notifications/settings - Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    // Validate the notification settings structure
    const requiredFields = ['emailNotifications', 'pushNotifications'];
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    // In a real implementation, this would save to a notification preferences table
    // For now, return the settings as provided with the user ID
    const updatedSettings = {
      userId: user.id,
      ...body,
      updatedAt: new Date().toISOString()
    };
    
    return createApiResponse(updatedSettings, 'Notification preferences updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/notifications/settings');
  }
}