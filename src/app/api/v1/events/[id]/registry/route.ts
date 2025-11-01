import { NextRequest } from 'next/server';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/events/[eventId]/registry - Get registry
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
    
    // In a real implementation, this would fetch registry data from a database
    // For now, return mock registry data
    const registryData = {
      eventId,
      type: 'wedding',
      externalLinks: [
        {
          name: 'John Lewis',
          url: 'https://www.johnlewis.com/wedding-list/abc123',
          logo: 'https://example.com/logos/john-lewis.png',
          description: 'Premium home goods and appliances'
        },
        {
          name: 'Debenhams',
          url: 'https://www.debenhams.com/wedding-list/xyz789',
          logo: 'https://example.com/logos/debenhams.png',
          description: 'Fashion, beauty, and home essentials'
        },
        {
          name: 'Amazon',
          url: 'https://www.amazon.co.uk/wedding/sarah-and-michael/12345',
          logo: 'https://example.com/logos/amazon.png',
          description: 'Everything you need, delivered fast'
        }
      ],
      thankYouNotes: {
        enabled: true,
        message: 'Thank you so much for your generous gifts. We truly appreciate your thoughtfulness and can\'t wait to use everything in our new home together.',
        signature: 'With love,\nSarah & Michael'
      },
      premiumCustomization: false,
      premiumCustomizationFeePaid: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return createApiResponse(registryData, 'Event registry retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/events/[eventId]/registry');
  }
}

// PUT /api/events/[eventId]/registry - Update registry
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
    if (body.type !== undefined) {
      const validTypes = ['wedding', 'birthday', 'corporate', 'baby-shower', 'anniversary'];
      if (!validTypes.includes(body.type)) {
        return createApiError(`Registry type must be one of: ${validTypes.join(', ')}`, 400);
      }
    }
    
    if (body.externalLinks !== undefined) {
      if (!Array.isArray(body.externalLinks)) {
        return createApiError('External links must be an array', 400);
      }
      
      // Validate each link
      for (const link of body.externalLinks) {
        if (typeof link !== 'object' || link === null) {
          return createApiError('Each external link must be an object', 400);
        }
        
        if (!link.name || typeof link.name !== 'string' || link.name.trim().length === 0) {
          return createApiError('Each link must have a non-empty name', 400);
        }
        
        if (!link.url || typeof link.url !== 'string' || link.url.trim().length === 0) {
          return createApiError('Each link must have a non-empty URL', 400);
        }
        
        // Basic URL validation
        try {
          new URL(link.url);
        } catch {
          return createApiError('Invalid URL format in external links', 400);
        }
      }
    }
    
    if (body.thankYouNotes !== undefined) {
      if (typeof body.thankYouNotes !== 'object' || body.thankYouNotes === null) {
        return createApiError('Thank you notes must be an object', 400);
      }
      
      if (body.thankYouNotes.enabled !== undefined && typeof body.thankYouNotes.enabled !== 'boolean') {
        return createApiError('Thank you notes enabled must be a boolean', 400);
      }
    }
    
    // Update registry
    const updatedRegistry = {
      eventId,
      type: body.type || 'wedding',
      externalLinks: body.externalLinks || [],
      thankYouNotes: body.thankYouNotes || {
        enabled: true,
        message: 'Thank you for your generous gift.',
        signature: 'With gratitude'
      },
      premiumCustomization: body.premiumCustomization || false,
      premiumCustomizationFeePaid: body.premiumCustomizationFeePaid || false,
      updatedAt: new Date().toISOString()
    };
    
    return createApiResponse(updatedRegistry, 'Event registry updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/events/[eventId]/registry');
  }
}