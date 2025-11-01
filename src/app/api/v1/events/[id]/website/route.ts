import { NextRequest } from 'next/server';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/events/[eventId]/website - Get event website data
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
    
    // In a real implementation, this would fetch website data from a database
    // For now, return mock website data
    const websiteData = {
      eventId,
      title: 'Sarah & Michael\'s Wedding',
      description: 'Join us as we celebrate our love and commitment',
      theme: 'elegant-white-gold',
      customDomain: null,
      isPublished: false,
      publishedUrl: null,
      sections: {
        hero: {
          enabled: true,
          title: 'Sarah & Michael',
          subtitle: 'Are Getting Married!',
          date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months from now
          location: 'Grand Ballroom, Lagos',
          backgroundImage: '/images/hero-default.jpg',
          countdownEnabled: true
        },
        story: {
          enabled: true,
          title: 'Our Love Story',
          content: 'We met in university and have been inseparable ever since...',
          images: ['/images/story-1.jpg', '/images/story-2.jpg']
        },
        eventDetails: {
          enabled: true,
          title: 'Event Details',
          date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
          time: '3:00 PM',
          location: 'Grand Ballroom, Lagos',
          address: '123 Wedding Avenue, Lagos, Nigeria',
          dressCode: 'Formal Attire',
          parkingInfo: 'Valet parking available'
        },
        rsvp: {
          enabled: true,
          title: 'RSVP',
          deadline: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString(), // 5 months from now
          formFields: ['name', 'email', 'attending', 'guestCount', 'dietaryRestrictions']
        },
        gallery: {
          enabled: true,
          title: 'Gallery',
          images: ['/images/gallery-1.jpg', '/images/gallery-2.jpg', '/images/gallery-3.jpg']
        },
        registry: {
          enabled: true,
          title: 'Gift Registry',
          description: 'Your presence is our present, but if you wish to contribute...'
        },
        contact: {
          enabled: true,
          title: 'Contact Us',
          email: 'wedding@sarahandmichael.com',
          phone: '+234 123 456 7890'
        }
      },
      customizations: {
        colors: {
          primary: '#ffffff',
          secondary: '#d4af37',
          accent: '#8a6b3f'
        },
        fonts: {
          heading: 'Playfair Display',
          body: 'Lora'
        }
      },
      seo: {
        metaTitle: 'Sarah & Michael\'s Wedding - Join Our Special Day',
        metaDescription: 'You\'re invited to celebrate Sarah and Michael\'s wedding on their special day',
        keywords: 'wedding, celebration, love, marriage, sarah, michael, nigeria'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return createApiResponse(websiteData, 'Event website data retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/events/[eventId]/website');
  }
}

// PUT /api/events/[eventId]/website - Update event website
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
    const validSections = ['hero', 'story', 'eventDetails', 'rsvp', 'gallery', 'registry', 'contact'];
    const invalidSections = Object.keys(body.sections || {}).filter(section => !validSections.includes(section));
    
    if (invalidSections.length > 0) {
      return createApiError(`Invalid sections: ${invalidSections.join(', ')}. Valid sections are: ${validSections.join(', ')}`, 400);
    }
    
    // Validate customization fields
    if (body.customizations) {
      const validCustomizationFields = ['colors', 'fonts'];
      const invalidCustomFields = Object.keys(body.customizations).filter(field => !validCustomizationFields.includes(field));
      
      if (invalidCustomFields.length > 0) {
        return createApiError(`Invalid customization fields: ${invalidCustomFields.join(', ')}. Valid fields are: ${validCustomizationFields.join(', ')}`, 400);
      }
    }
    
    // Update website data
    const updatedWebsite = {
      eventId,
      title: body.title || 'Event Website',
      description: body.description,
      theme: body.theme,
      customDomain: body.customDomain,
      sections: body.sections,
      customizations: body.customizations,
      seo: body.seo,
      updatedAt: new Date().toISOString()
    };
    
    return createApiResponse(updatedWebsite, 'Event website updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/events/[eventId]/website');
  }
}