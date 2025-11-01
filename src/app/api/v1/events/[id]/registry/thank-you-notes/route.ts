import { NextRequest } from 'next/server';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/events/[eventId]/registry/thank-you-notes - Get thank-you note tracker
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
    const eventExists = true; // Placeholder
    
    if (!eventExists) {
      return createApiError('Event not found or you do not have permission', 404);
    }
    
    // In a real implementation, this would fetch thank-you note tracking data
    // For now, return mock thank-you note tracker
    
    const thankYouNotesTracker = {
      eventId,
      enabled: true,
      customMessage: 'Thank you so much for your generous gifts. We truly appreciate your thoughtfulness and can\'t wait to use everything in our new home together.',
      signature: 'With love,\nSarah & Michael',
      tracking: {
        totalContributors: 42,
        thankedContributors: 38,
        pendingThankYous: 4,
        lastThankYouSent: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        nextScheduledSend: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
      },
      pendingNotes: [
        {
          id: 'pending-1',
          contributorName: 'John & Jane Smith',
          contributionAmount: 50000,
          contributionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          preferredContact: 'email',
          contactInfo: 'john.smith@example.com',
          message: 'Wishing you a lifetime of love and happiness together!'
        },
        {
          id: 'pending-2',
          contributorName: 'Robert Johnson',
          contributionAmount: 25000,
          contributionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          preferredContact: 'email',
          contactInfo: 'r.johnson@example.com',
          message: 'Congratulations on your special day!'
        }
      ],
      sentNotes: [
        {
          id: 'sent-1',
          contributorName: 'Mary Wilson',
          contributionAmount: 30000,
          contributionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
          sentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          messageSent: 'Dear Mary, thank you so much for your generous gift. Your kindness means the world to us. We hope to see you soon!',
          responseReceived: true,
          responseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          responseMessage: 'You\'re very welcome! So happy to be part of your special day.'
        }
      ],
      settings: {
        autoSend: true,
        sendDelay: 48, // Hours to wait before sending thank you
        includePhoto: true,
        includeEventPhoto: true,
        includeRegistryLink: false
      },
      updatedAt: new Date().toISOString()
    };
    
    return createApiResponse(thankYouNotesTracker, 'Thank-you notes tracker retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/events/[eventId]/registry/thank-you-notes');
  }
}

// PUT /api/events/[eventId]/registry/thank-you-notes - Update thank-you notes settings
export async function PUT(
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
    const eventExists = true; // Placeholder
    
    if (!eventExists) {
      return createApiError('Event not found or you do not have permission', 404);
    }
    
    const body = await request.json();
    
    // Validate update fields
    if (body.enabled !== undefined) {
      if (typeof body.enabled !== 'boolean') {
        return createApiError('Enabled must be a boolean', 400);
      }
    }
    
    if (body.customMessage !== undefined) {
      if (typeof body.customMessage !== 'string') {
        return createApiError('Custom message must be a string', 400);
      }
    }
    
    if (body.signature !== undefined) {
      if (typeof body.signature !== 'string') {
        return createApiError('Signature must be a string', 400);
      }
    }
    
    if (body.settings !== undefined) {
      if (typeof body.settings !== 'object' || body.settings === null) {
        return createApiError('Settings must be an object', 400);
      }
      
      if (body.settings.autoSend !== undefined && typeof body.settings.autoSend !== 'boolean') {
        return createApiError('Settings.autoSend must be a boolean', 400);
      }
      
      if (body.settings.sendDelay !== undefined) {
        if (typeof body.settings.sendDelay !== 'number' || body.settings.sendDelay < 0) {
          return createApiError('Settings.sendDelay must be a non-negative number', 400);
        }
      }
      
      if (body.settings.includePhoto !== undefined && typeof body.settings.includePhoto !== 'boolean') {
        return createApiError('Settings.includePhoto must be a boolean', 400);
      }
      
      if (body.settings.includeEventPhoto !== undefined && typeof body.settings.includeEventPhoto !== 'boolean') {
        return createApiError('Settings.includeEventPhoto must be a boolean', 400);
      }
      
      if (body.settings.includeRegistryLink !== undefined && typeof body.settings.includeRegistryLink !== 'boolean') {
        return createApiError('Settings.includeRegistryLink must be a boolean', 400);
      }
    }
    
    // Update thank-you notes settings
    const updatedSettings = {
      eventId,
      enabled: body.enabled !== undefined ? body.enabled : true,
      customMessage: body.customMessage || 'Thank you for your generous gift!',
      signature: body.signature || 'With gratitude',
      settings: {
        autoSend: body.settings?.autoSend !== undefined ? body.settings.autoSend : true,
        sendDelay: body.settings?.sendDelay !== undefined ? body.settings.sendDelay : 48,
        includePhoto: body.settings?.includePhoto !== undefined ? body.settings.includePhoto : true,
        includeEventPhoto: body.settings?.includeEventPhoto !== undefined ? body.settings.includeEventPhoto : true,
        includeRegistryLink: body.settings?.includeRegistryLink !== undefined ? body.settings.includeRegistryLink : false
      },
      updatedAt: new Date().toISOString()
    };
    
    return createApiResponse(updatedSettings, 'Thank-you notes settings updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/events/[eventId]/registry/thank-you-notes');
  }
}