import { NextRequest } from 'next/server';
import { createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/public/events/:slug - Public endpoint for event website
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    
    if (!slug) {
      return createApiError('Event slug is required', 400);
    }
    
    // In a real implementation, this would fetch the published website data
    // For now, return mock public event website data
    const publicEventData = {
      slug,
      title: 'Sarah & Michael\'s Wedding Celebration',
      description: 'You\'re invited to celebrate our special day with us',
      eventDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months from now
      theme: 'elegant-white-gold',
      sections: {
        hero: {
          enabled: true,
          title: 'Sarah & Michael',
          subtitle: 'Are Getting Married!',
          date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
          location: 'Grand Ballroom, Lagos',
          backgroundImage: 'https://example.com/images/hero-bg.jpg',
          countdownEnabled: true
        },
        story: {
          enabled: true,
          title: 'Our Love Story',
          content: 'We met in university and have been inseparable ever since. Our journey together has been filled with laughter, adventures, and countless memories. We can\'t wait to start our new life together and share this joy with our closest family and friends.',
          images: [
            'https://example.com/images/story-1.jpg',
            'https://example.com/images/story-2.jpg'
          ]
        },
        eventDetails: {
          enabled: true,
          title: 'Event Details',
          date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
          time: '3:00 PM',
          location: 'Grand Ballroom, Lagos',
          address: '123 Wedding Avenue, Lagos, Nigeria',
          dressCode: 'Formal Attire',
          parkingInfo: 'Valet parking available',
          directions: 'Take the expressway to exit 12, then follow signs to Grand Ballroom'
        },
        rsvp: {
          enabled: true,
          title: 'RSVP',
          deadline: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString(),
          formFields: ['name', 'email', 'attending', 'guestCount', 'dietaryRestrictions']
        },
        gallery: {
          enabled: true,
          title: 'Gallery',
          images: [
            'https://example.com/images/gallery-1.jpg',
            'https://example.com/images/gallery-2.jpg',
            'https://example.com/images/gallery-3.jpg',
            'https://example.com/images/gallery-4.jpg'
          ]
        },
        registry: {
          enabled: true,
          title: 'Gift Registry',
          description: 'Your presence is our present, but if you wish to contribute to our new home, we have registered at these retailers:',
          registries: [
            {
              name: 'John Lewis',
              url: 'https://www.johnlewis.com/wedding-list/abc123',
              logo: 'https://example.com/logos/john-lewis.png'
            },
            {
              name: 'Debenhams',
              url: 'https://www.debenhams.com/wedding-list/xyz789',
              logo: 'https://example.com/logos/debenhams.png'
            }
          ]
        },
        contact: {
          enabled: true,
          title: 'Contact Us',
          email: 'wedding@sarahandmichael.com',
          phone: '+234 123 456 7890',
          message: 'For any questions about the event, please don\'t hesitate to reach out to us.'
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
      metadata: {
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        views: 1247
      }
    };
    
    return createApiResponse(publicEventData, 'Public event website data retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/public/events/[slug]');
  }
}