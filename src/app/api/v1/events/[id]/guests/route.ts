import { NextRequest } from 'next/server';
import { GuestService } from '@/lib/guest-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/events/[eventId]/guests - List all guests
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
    
    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const rsvpStatus = searchParams.get('rsvpStatus') || undefined; // 'YES', 'NO', 'MAYBE', etc.
    const search = searchParams.get('search') || undefined;
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return createApiError('Invalid pagination parameters', 400);
    }
    
    // In a real implementation, GuestService would exist
    // For now, we'll return mock data
    const mockGuests = [
      {
        id: 'guest-1',
        eventId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        dietaryRestrictions: 'Vegetarian',
        rsvp: 'YES',
        invitedBy: user.id,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        updatedAt: new Date()
      },
      {
        id: 'guest-2',
        eventId,
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567891',
        dietaryRestrictions: '',
        rsvp: 'NO',
        invitedBy: user.id,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updatedAt: new Date()
      },
      {
        id: 'guest-3',
        eventId,
        name: 'Bob Johnson',
        email: 'bob@example.com',
        phone: '+1234567892',
        dietaryRestrictions: 'Gluten-free',
        rsvp: 'MAYBE',
        invitedBy: user.id,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date()
      }
    ];
    
    // Filter by RSVP status if provided
    let filteredGuests = mockGuests;
    if (rsvpStatus) {
      filteredGuests = mockGuests.filter(guest => guest.rsvp === rsvpStatus);
    }
    
    // Filter by search term if provided
    if (search) {
      filteredGuests = filteredGuests.filter(guest => 
        guest.name.toLowerCase().includes(search.toLowerCase()) ||
        guest.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedGuests = filteredGuests.slice(startIndex, startIndex + limit);
    
    return createApiResponse({
      guests: paginatedGuests,
      pagination: {
        page,
        limit,
        total: filteredGuests.length,
        pages: Math.ceil(filteredGuests.length / limit)
      }
    }, 'Guests retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/events/[eventId]/guests');
  }
}

// POST /api/events/[eventId]/guests - Add guest
export async function POST(
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
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'email'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return createApiError('Invalid email format', 400);
    }
    
    // In a real implementation, we would create the guest in the database
    // For now, we'll return mock data
    const newGuest = {
      id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventId,
      name: body.name,
      email: body.email,
      phone: body.phone || '',
      dietaryRestrictions: body.dietaryRestrictions || '',
      rsvp: body.rsvp || 'MAYBE',
      invitedBy: user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return createApiResponse(newGuest, 'Guest added successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/events/[eventId]/guests');
  }
}