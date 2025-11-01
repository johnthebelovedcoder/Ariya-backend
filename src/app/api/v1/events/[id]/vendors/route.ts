import { NextRequest } from 'next/server';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/events/[eventId]/vendors - List booked vendors for event
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
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category') || undefined;
    
    // In a real implementation, this would fetch booked vendors from a database
    // For now, return mock vendor data
    const mockVendors = [
      {
        id: 'vendor-1',
        eventId,
        vendorId: 'caterer-123',
        businessName: 'Elegant Caterers',
        category: 'Catering',
        description: 'Premium catering services for all types of events',
        pricing: 50000,
        location: 'Lagos, Nigeria',
        ratingAverage: 4.8,
        totalReviews: 42,
        bookingStatus: 'confirmed',
        paymentStatus: 'paid',
        contactInfo: {
          email: 'info@elegantcaterers.com',
          phone: '+234 123 456 7890'
        },
        bookingDetails: {
          amount: 150000,
          currency: 'NGN',
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Full meal service for 50 guests'
        }
      },
      {
        id: 'vendor-2',
        eventId,
        vendorId: 'photographer-456',
        businessName: 'Capture Moments Photography',
        category: 'Photography',
        description: 'Professional photography services for weddings and events',
        pricing: 30000,
        location: 'Lagos, Nigeria',
        ratingAverage: 4.9,
        totalReviews: 28,
        bookingStatus: 'pending',
        paymentStatus: 'pending',
        contactInfo: {
          email: 'hello@capturemoments.com',
          phone: '+234 987 654 3210'
        },
        bookingDetails: {
          amount: 80000,
          currency: 'NGN',
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
          notes: '8-hour coverage with 100 edited photos'
        }
      }
    ];
    
    // Apply category filter
    let filteredVendors = mockVendors;
    
    if (category) {
      filteredVendors = filteredVendors.filter(vendor => 
        vendor.category.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedVendors = filteredVendors.slice(startIndex, startIndex + limit);
    
    return createApiResponse({
      vendors: paginatedVendors,
      pagination: {
        page,
        limit,
        total: filteredVendors.length,
        pages: Math.ceil(filteredVendors.length / limit)
      },
      filters: {
        category
      }
    }, 'Booked vendors retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/events/[eventId]/vendors');
  }
}

// POST /api/events/[eventId]/vendors - Assign vendor to event
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
    
    // Verify user has access to the event
    const eventExists = true; // Placeholder
    
    if (!eventExists) {
      return createApiError('Event not found or you do not have permission', 404);
    }
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['vendorId'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    // In a real implementation, this would create a booking record
    // For now, return mock booking data
    const newBooking = {
      id: `booking_${Date.now()}`,
      eventId,
      vendorId: body.vendorId,
      bookingStatus: 'pending',
      paymentStatus: 'pending',
      amount: body.amount || 0,
      currency: body.currency || 'NGN',
      startDate: body.startDate ? new Date(body.startDate).toISOString() : new Date().toISOString(),
      endDate: body.endDate ? new Date(body.endDate).toISOString() : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      notes: body.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return createApiResponse(newBooking, 'Vendor assigned to event successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/events/[eventId]/vendors');
  }
}