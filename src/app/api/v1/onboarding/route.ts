import { NextRequest } from 'next/server';
import { requireAuthApi, createApiResponse, createApiError, handleApiError, sanitizeInput } from '@/lib/api-utils';
import { validateInput } from '@/lib/validation';
import prisma from '@/lib/prisma';
import { VendorService } from '@/lib/vendor-service';
import { EventService } from '@/lib/event-service';

// POST /api/onboarding - Handle onboarding flow for both vendors and planners
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    // Sanitize input
    const sanitizedBody = sanitizeInput(body);
    
    // Validate required fields
    if (!sanitizedBody.step || !sanitizedBody.flowType) {
      return createApiError('Step and flowType are required', 400);
    }
    
    const { flowType, step } = sanitizedBody;
    
    if (flowType === 'vendor') {
      return await handleVendorOnboarding(user.id, sanitizedBody);
    } else if (flowType === 'planner') {
      return await handlePlannerOnboarding(user.id, sanitizedBody);
    } else {
      return createApiError('Invalid flowType. Must be "vendor" or "planner"', 400);
    }
  } catch (error: any) {
    return handleApiError(error, 'POST /api/onboarding');
  }
}

// Handle vendor onboarding steps
async function handleVendorOnboarding(userId: string, data: any) {
  const { step } = data;
  
  switch (step) {
    case 'business-info':
      // Validate business info
      const businessValidation = validateInput(data, {
        businessName: { required: true, minLength: 2, maxLength: 100, type: 'string' },
        category: { required: true, minLength: 2, maxLength: 100, type: 'string' },
        description: { required: true, minLength: 10, maxLength: 500, type: 'string' },
        pricing: { required: true, type: 'number', min: 0 }
      });
      
      if (!businessValidation.isValid) {
        return createApiError(`Validation failed: ${businessValidation.errors.join(', ')}`, 400);
      }
      
      // Update user role to vendor if not already set
      await prisma.user.update({
        where: { id: userId },
        data: { role: 'VENDOR' }
      });
      
      // Create or update vendor profile
      let vendor = await prisma.vendor.findUnique({
        where: { userId }
      });
      
      if (vendor) {
        vendor = await prisma.vendor.update({
          where: { userId },
          data: {
            businessName: data.businessName,
            category: data.category,
            description: data.description,
            pricing: data.pricing
          }
        });
      } else {
        vendor = await prisma.vendor.create({
          data: {
            userId,
            businessName: data.businessName,
            category: data.category,
            description: data.description,
            pricing: data.pricing,
            location: data.location || ''
          }
        });
      }
      
      return createApiResponse({ 
        vendorId: vendor.id,
        message: 'Business information saved successfully' 
      }, 'Business information saved successfully');
      
    case 'location':
      // Validate location info
      const locationValidation = validateInput(data, {
        country: { required: true, type: 'string', maxLength: 100 },
        state: { required: true, type: 'string', maxLength: 100 },
        city: { required: true, type: 'string', maxLength: 100 }
      });
      
      if (!locationValidation.isValid) {
        return createApiError(`Validation failed: ${locationValidation.errors.join(', ')}`, 400);
      }
      
      // Combine location into a single field (as the current schema expects)
      const fullLocation = `${data.city}, ${data.state}, ${data.country}`;
      
      await prisma.vendor.update({
        where: { userId },
        data: { 
          location: fullLocation,
          // Update user's country as well
          user: {
            update: {
              country: data.country
            }
          }
        }
      });
      
      return createApiResponse({ 
        location: fullLocation,
        message: 'Location information saved successfully' 
      }, 'Location information saved successfully');
      
    case 'media':
      // Validate media upload
      const mediaValidation = validateInput(data, {
        selfieUrl: { type: 'url', maxLength: 500 },
        logoUrl: { type: 'url', maxLength: 500 },
        portfolio: { type: 'array' }
      });
      
      if (!mediaValidation.isValid) {
        return createApiError(`Validation failed: ${mediaValidation.errors.join(', ')}`, 400);
      }
      
      // Update vendor profile with media
      await prisma.vendor.update({
        where: { userId },
        data: { 
          portfolio: data.portfolio || [],
          // Update user profile image if selfie is provided
          ...(data.selfieUrl && {
            user: {
              update: {
                profileImage: data.selfieUrl
              }
            }
          })
        }
      });
      
      return createApiResponse({ 
        selfieUrl: data.selfieUrl,
        logoUrl: data.logoUrl,
        portfolio: data.portfolio,
        message: 'Media uploaded successfully' 
      }, 'Media uploaded successfully');
      
    default:
      return createApiError('Invalid step for vendor onboarding', 400);
  }
}

// Handle planner onboarding steps
async function handlePlannerOnboarding(userId: string, data: any) {
  const { step } = data;
  
  switch (step) {
    case 'event-type':
      // Validate event type
      const typeValidation = validateInput(data, {
        eventType: { required: true, type: 'string', maxLength: 100 }
      });
      
      if (!typeValidation.isValid) {
        return createApiError(`Validation failed: ${typeValidation.errors.join(', ')}`, 400);
      }
      
      // Create an event for the user (or update existing)
      const event = await prisma.event.upsert({
        where: {
          id: data.eventId || `temp_event_${userId}`
        },
        update: {
          type: data.eventType,
          userId
        },
        create: {
          name: `${data.eventType} Planning`,
          type: data.eventType,
          date: new Date(),
          location: '',
          budget: 0,
          userId
        }
      });
      
      return createApiResponse({ 
        eventId: event.id,
        eventType: event.type,
        message: 'Event type saved successfully' 
      }, 'Event type saved successfully');
      
    case 'event-date':
      // Validate event date
      const dateValidation = validateInput(data, {
        eventDate: { required: true, type: 'string' }, // Could be date string or one of the options
        eventTiming: { type: 'string', maxLength: 100 } // e.g., 'this_month', 'next_month', 'next_year'
      });
      
      if (!dateValidation.isValid) {
        return createApiError(`Validation failed: ${dateValidation.errors.join(', ')}`, 400);
      }
      
      // Update event with date
      const eventDate = data.eventDate.includes('T') ? 
        new Date(data.eventDate) : 
        parseEventTiming(data.eventTiming || data.eventDate);
      
      await prisma.event.update({
        where: { id: data.eventId },
        data: { date: eventDate }
      });
      
      return createApiResponse({ 
        eventId: data.eventId,
        eventDate: eventDate,
        message: 'Event date saved successfully' 
      }, 'Event date saved successfully');
      
    case 'event-location':
      // Validate location info
      const eventLocationValidation = validateInput(data, {
        country: { required: true, type: 'string', maxLength: 100 },
        state: { required: true, type: 'string', maxLength: 100 },
        city: { required: true, type: 'string', maxLength: 100 }
      });
      
      if (!eventLocationValidation.isValid) {
        return createApiError(`Validation failed: ${eventLocationValidation.errors.join(', ')}`, 400);
      }
      
      // Combine location into a single field
      const fullLocation = `${data.city}, ${data.state}, ${data.country}`;
      
      await prisma.event.update({
        where: { id: data.eventId },
        data: { location: fullLocation }
      });
      
      // Also update user's country preference
      await prisma.user.update({
        where: { id: userId },
        data: { country: data.country }
      });
      
      return createApiResponse({ 
        eventId: data.eventId,
        location: fullLocation,
        message: 'Event location saved successfully' 
      }, 'Event location saved successfully');
      
    case 'event-budget':
      // Validate budget
      const budgetValidation = validateInput(data, {
        budget: { required: true, type: 'number', min: 0 }
      });
      
      if (!budgetValidation.isValid) {
        return createApiError(`Validation failed: ${budgetValidation.errors.join(', ')}`, 400);
      }
      
      await prisma.event.update({
        where: { id: data.eventId },
        data: { budget: data.budget }
      });
      
      return createApiResponse({ 
        eventId: data.eventId,
        budget: data.budget,
        message: 'Event budget saved successfully' 
      }, 'Event budget saved successfully');
      
    case 'guest-count':
      // Validate guest count
      const guestValidation = validateInput(data, {
        guestCount: { required: true, type: 'number', min: 0 }
      });
      
      if (!guestValidation.isValid) {
        return createApiError(`Validation failed: ${guestValidation.errors.join(', ')}`, 400);
      }
      
      await prisma.event.update({
        where: { id: data.eventId },
        data: { guestCount: data.guestCount }
      });
      
      return createApiResponse({ 
        eventId: data.eventId,
        guestCount: data.guestCount,
        message: 'Guest count saved successfully' 
      }, 'Guest count saved successfully');
      
    case 'vendor-services':
      // Validate vendor services
      const servicesValidation = validateInput(data, {
        services: { required: true, type: 'array' }
      });
      
      if (!servicesValidation.isValid) {
        return createApiError(`Validation failed: ${servicesValidation.errors.join(', ')}`, 400);
      }
      
      // Store selected services as event notes or create a separate mapping
      await prisma.event.update({
        where: { id: data.eventId },
        data: { 
          notes: data.services.join(', ') // Could store this differently based on requirements
        }
      });
      
      return createApiResponse({ 
        eventId: data.eventId,
        services: data.services,
        message: 'Services needed saved successfully' 
      }, 'Services needed saved successfully');
      
    case 'event-style':
      // Validate event style
      const styleValidation = validateInput(data, {
        style: { required: true, type: 'string', maxLength: 100 }
      });
      
      if (!styleValidation.isValid) {
        return createApiError(`Validation failed: ${styleValidation.errors.join(', ')}`, 400);
      }
      
      await prisma.event.update({
        where: { id: data.eventId },
        data: { theme: data.style }
      });
      
      return createApiResponse({ 
        eventId: data.eventId,
        style: data.style,
        message: 'Event style saved successfully' 
      }, 'Event style saved successfully');
      
    default:
      return createApiError('Invalid step for planner onboarding', 400);
  }
}

// Helper function to parse event timing
function parseEventTiming(timing: string): Date {
  const now = new Date();
  
  switch (timing) {
    case 'this_morning':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
    case 'next_month':
      return new Date(now.getFullYear(), now.getMonth() + 1, 1);
    case 'next_year':
      return new Date(now.getFullYear() + 1, 0, 1);
    default:
      // If it's already a date string, return it as a date
      return new Date(timing);
  }
}