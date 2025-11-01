import { NextRequest } from 'next/server';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/notifications/settings - Get notification preferences
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // In a real implementation, this would fetch user's notification preferences from the database
    // For now, return mock notification settings
    const notificationSettings = {
      userId: user.id,
      email: {
        enabled: true,
        types: {
          bookingConfirmation: true,
          bookingReminder: true,
          paymentConfirmation: true,
          systemAlerts: true,
          promotional: false
        },
        frequency: 'immediate' // immediate, daily_digest, weekly_digest
      },
      push: {
        enabled: true,
        types: {
          bookingConfirmation: true,
          bookingReminder: true,
          paymentConfirmation: true,
          systemAlerts: true,
          promotional: false
        }
      },
      sms: {
        enabled: false,
        types: {
          bookingConfirmation: false,
          bookingReminder: true,
          paymentConfirmation: false,
          systemAlerts: false
        }
      },
      inApp: {
        enabled: true,
        types: {
          bookingConfirmation: true,
          bookingReminder: true,
          paymentConfirmation: true,
          systemAlerts: true,
          promotional: false
        }
      },
      updatedAt: new Date().toISOString()
    };
    
    return createApiResponse(notificationSettings, 'Notification settings retrieved successfully');
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
    
    // Validate notification settings structure
    if (!body.email && !body.push && !body.sms && !body.inApp) {
      return createApiError('At least one notification channel must be provided', 400);
    }
    
    // Validate email settings if provided
    if (body.email) {
      const validFrequencies = ['immediate', 'daily_digest', 'weekly_digest'];
      if (body.email.frequency && !validFrequencies.includes(body.email.frequency)) {
        return createApiError(`Invalid email frequency. Valid values: ${validFrequencies.join(', ')}`, 400);
      }
    }
    
    // In a real implementation, this would update user's notification preferences in the database
    // For now, return mock updated settings
    const updatedSettings = {
      userId: user.id,
      email: body.email || {
        enabled: true,
        types: {
          bookingConfirmation: true,
          bookingReminder: true,
          paymentConfirmation: true,
          systemAlerts: true,
          promotional: false
        },
        frequency: 'immediate'
      },
      push: body.push || {
        enabled: true,
        types: {
          bookingConfirmation: true,
          bookingReminder: true,
          paymentConfirmation: true,
          systemAlerts: true,
          promotional: false
        }
      },
      sms: body.sms || {
        enabled: false,
        types: {
          bookingConfirmation: false,
          bookingReminder: true,
          paymentConfirmation: false,
          systemAlerts: false
        }
      },
      inApp: body.inApp || {
        enabled: true,
        types: {
          bookingConfirmation: true,
          bookingReminder: true,
          paymentConfirmation: true,
          systemAlerts: true,
          promotional: false
        }
      },
      updatedAt: new Date().toISOString()
    };
    
    return createApiResponse(updatedSettings, 'Notification settings updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/notifications/settings');
  }
}