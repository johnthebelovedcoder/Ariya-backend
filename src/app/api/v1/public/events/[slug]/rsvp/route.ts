import { NextRequest } from 'next/server';
import { createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// POST /api/public/events/[slug]/rsvp - Public RSVP submission
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    
    if (!slug) {
      return createApiError('Event slug is required', 400);
    }
    
    const body = await request.json();
    
    // Validate required RSVP fields
    const requiredFields = ['name', 'email', 'attending'];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return createApiError('Invalid email format', 400);
    }
    
    // Validate attending field
    if (typeof body.attending !== 'boolean') {
      return createApiError('Attending must be a boolean value (true/false)', 400);
    }
    
    // Validate guest count if provided
    if (body.guestCount !== undefined) {
      if (typeof body.guestCount !== 'number' || body.guestCount < 0 || !Number.isInteger(body.guestCount)) {
        return createApiError('Guest count must be a non-negative integer', 400);
      }
    }
    
    // Validate dietary restrictions if provided
    if (body.dietaryRestrictions !== undefined && typeof body.dietaryRestrictions !== 'string') {
      return createApiError('Dietary restrictions must be a string', 400);
    }
    
    // In a real implementation, this would:
    // 1. Verify the event slug exists and is published
    // 2. Check if RSVP deadline has passed
    // 3. Check if guest already exists and update or create new
    // 4. Send confirmation email
    // 5. Update event analytics
    // For now, return mock RSVP response
    
    const rsvpConfirmation = {
      id: `rsvp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventId: `event_${slug}`,
      slug,
      guestName: body.name,
      guestEmail: body.email,
      attending: body.attending,
      guestCount: body.guestCount || 1,
      dietaryRestrictions: body.dietaryRestrictions || null,
      message: body.message || null,
      submittedAt: new Date().toISOString(),
      confirmationCode: `CONF-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      status: 'confirmed',
      estimatedArrival: body.estimatedArrival ? new Date(body.estimatedArrival).toISOString() : null
    };
    
    // In a real implementation, we might return different status codes:
    // 201 for new RSVP
    // 200 for updated RSVP
    // 409 for conflict (already RSVP'd)
    
    return createApiResponse(rsvpConfirmation, 'RSVP submitted successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/public/events/[slug]/rsvp');
  }
}