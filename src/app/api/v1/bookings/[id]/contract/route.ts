import { NextRequest } from 'next/server';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/bookings/[bookingId]/contract - Get booking contract/agreement
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    
    if (!bookingId) {
      return createApiError('Booking ID is required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Verify user has access to the booking
    const bookingExists = true; // Placeholder
    
    if (!bookingExists) {
      return createApiError('Booking not found or you do not have permission', 404);
    }
    
    // In a real implementation, this would fetch the booking contract from a database
    // For now, return mock contract data
    
    const contractData = {
      bookingId,
      eventId: `event_${bookingId}`,
      vendorId: `vendor_${bookingId}`,
      clientName: 'Sarah Johnson',
      clientEmail: 'sarah.johnson@example.com',
      vendorBusinessName: 'Elegant Caterers Ltd',
      vendorContactPerson: 'Michael Brown',
      vendorEmail: 'michael@elegantcaterers.com',
      eventDetails: {
        eventName: 'Sarah & Michael\'s Wedding Reception',
        eventType: 'Wedding',
        eventDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months from now
        eventTime: '3:00 PM - 11:00 PM',
        location: 'Grand Ballroom, Lagos',
        guestCount: 150
      },
      services: [
        {
          serviceName: 'Full Meal Service',
          description: 'Three-course plated meal service for all guests',
          quantity: 150,
          unitPrice: 5000,
          totalPrice: 750000,
          category: 'Catering'
        },
        {
          serviceName: 'Beverage Service',
          description: 'Unlimited soft drinks, wine, and beer service',
          quantity: 150,
          unitPrice: 2000,
          totalPrice: 300000,
          category: 'Beverages'
        }
      ],
      termsAndConditions: [
        'Payment schedule: 30% deposit upon signing, 50% 30 days before event, 20% on event day',
        'Cancellation policy: Cancellations 60+ days before event receive 50% refund, cancellations 30-59 days before receive 25% refund',
        'Changes to guest count must be notified 14 days before event',
        'Vendor is responsible for food safety and proper licensing',
        'Client is responsible for venue access and basic amenities (electricity, water)',
        'Force majeure clause applies for unforeseen circumstances'
      ],
      pricing: {
        subtotal: 1050000,
        serviceFee: 52500, // 5% service fee
        taxes: 78750, // 7.5% tax
        total: 1181250,
        currency: 'NGN',
        paymentSchedule: [
          {
            milestone: 'Deposit',
            percentage: 30,
            amount: 354375,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            status: 'pending'
          },
          {
            milestone: 'Balance',
            percentage: 70,
            amount: 826875,
            dueDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString(), // 150 days from now
            status: 'pending'
          }
        ]
      },
      signatures: {
        client: {
          name: 'Sarah Johnson',
          signed: true,
          signedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        vendor: {
          name: 'Michael Brown',
          signed: true,
          signedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
          ipAddress: '203.0.113.45',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      },
      legal: {
        governingLaw: 'Nigerian Law',
        disputeResolution: 'Lagos State Courts',
        contractVersion: '1.2',
        effectiveDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      status: 'signed',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return createApiResponse(contractData, 'Booking contract retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/bookings/[bookingId]/contract');
  }
}

// POST /api/bookings/[bookingId]/contract - Generate/initiate contract
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    
    if (!bookingId) {
      return createApiError('Booking ID is required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Verify user has access to the booking
    const bookingExists = true; // Placeholder
    
    if (!bookingExists) {
      return createApiError('Booking not found or you do not have permission', 404);
    }
    
    const body = await request.json();
    
    // Validate contract generation fields
    if (body.template !== undefined) {
      if (typeof body.template !== 'string' || body.template.trim().length === 0) {
        return createApiError('Template must be a non-empty string', 400);
      }
    }
    
    if (body.customTerms !== undefined) {
      if (!Array.isArray(body.customTerms)) {
        return createApiError('Custom terms must be an array', 400);
      }
      
      for (const term of body.customTerms) {
        if (typeof term !== 'string' || term.trim().length === 0) {
          return createApiError('Each custom term must be a non-empty string', 400);
        }
      }
    }
    
    if (body.signatory !== undefined) {
      if (typeof body.signatory !== 'object' || body.signatory === null) {
        return createApiError('Signatory must be an object', 400);
      }
      
      if (!body.signatory.name || typeof body.signatory.name !== 'string' || body.signatory.name.trim().length === 0) {
        return createApiError('Signatory name is required and must be a non-empty string', 400);
      }
    }
    
    // In a real implementation, this would:
    // 1. Generate a contract based on template and booking details
    // 2. Store contract in database
    // 3. Send for electronic signature if needed
    // For now, return mock contract generation response
    
    const generatedContract = {
      id: `contract_${bookingId}_${Date.now()}`,
      bookingId,
      status: 'draft',
      template: body.template || 'standard_vendor_agreement',
      customTerms: body.customTerms || [],
      signatories: [
        {
          type: 'client',
          name: body.signatory?.name || 'Event Planner',
          email: user.email,
          role: 'Client',
          required: true,
          signed: false
        },
        {
          type: 'vendor',
          name: 'Vendor Representative',
          email: 'vendor@example.com', // Would be vendor's email in real implementation
          role: 'Service Provider',
          required: true,
          signed: false
        }
      ],
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Expires in 30 days
      downloadUrl: `https://contracts.ariya.com/${bookingId}/contract.pdf`,
      shareableLink: `https://contracts.ariya.com/sign/${bookingId}/${Math.random().toString(36).substr(2, 10)}`
    };
    
    return createApiResponse(generatedContract, 'Contract generated successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/bookings/[bookingId]/contract');
  }
}