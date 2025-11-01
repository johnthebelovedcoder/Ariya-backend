import { NextRequest } from 'next/server';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// Helper to extract vendor ID from URL
function getVendorIdFromUrl(url: string): string | null {
  // Extract vendorId from URL - pattern: /api/events/[eventId]/vendors/[vendorId]/payment
  const match = url.match(/\/api\/events\/[^\/]+\/vendors\/([^\/\?]+)\/payment/);
  return match ? match[1] : null;
}

// PUT /api/events/[eventId]/vendors/[vendorId]/payment - Track payment to vendor
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: eventId } = params;
    const vendorId = getVendorIdFromUrl(request.url);
    
    if (!eventId || !vendorId) {
      return createApiError('Event ID and Vendor ID are required', 400);
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
    const requiredFields = ['paymentStatus'];
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    // Validate payment status
    const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
    if (!validPaymentStatuses.includes(body.paymentStatus)) {
      return createApiError(`Payment status must be one of: ${validPaymentStatuses.join(', ')}`, 400);
    }
    
    if (body.amount !== undefined) {
      if (typeof body.amount !== 'number' || body.amount < 0) {
        return createApiError('Amount must be a non-negative number', 400);
      }
    }
    
    if (body.transactionId !== undefined) {
      if (typeof body.transactionId !== 'string' || body.transactionId.trim().length === 0) {
        return createApiError('Transaction ID must be a non-empty string', 400);
      }
    }
    
    if (body.paymentMethod !== undefined) {
      if (typeof body.paymentMethod !== 'string' || body.paymentMethod.trim().length === 0) {
        return createApiError('Payment method must be a non-empty string', 400);
      }
    }
    
    // Update payment tracking
    const paymentTracking = {
      id: `payment_${vendorId}_${Date.now()}`,
      eventId,
      vendorId,
      paymentStatus: body.paymentStatus,
      amount: body.amount,
      currency: body.currency || 'NGN',
      transactionId: body.transactionId,
      paymentMethod: body.paymentMethod,
      notes: body.notes,
      updatedAt: new Date().toISOString(),
      timestamp: body.timestamp ? new Date(body.timestamp).toISOString() : new Date().toISOString()
    };
    
    return createApiResponse(paymentTracking, 'Payment tracking updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/events/[eventId]/vendors/[vendorId]/payment');
  }
}

// GET /api/events/[eventId]/vendors/[vendorId]/payment - Get payment details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: eventId } = params;
    const vendorId = getVendorIdFromUrl(request.url);
    
    if (!eventId || !vendorId) {
      return createApiError('Event ID and Vendor ID are required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Verify user has access to the event
    const eventExists = true; // Placeholder
    
    if (!eventExists) {
      return createApiError('Event not found or you do not have permission', 404);
    }
    
    // In a real implementation, this would fetch payment details from a database
    // For now, return mock payment data
    const paymentDetails = {
      id: `payment_${vendorId}`,
      eventId,
      vendorId,
      paymentStatus: 'pending',
      amount: 50000,
      currency: 'NGN',
      transactionId: null,
      paymentMethod: null,
      notes: 'Initial booking payment',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        {
          id: 'history-1',
          paymentId: `payment_${vendorId}`,
          status: 'pending',
          amount: 50000,
          timestamp: new Date().toISOString(),
          notes: 'Payment initiated'
        }
      ]
    };
    
    return createApiResponse(paymentDetails, 'Payment details retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/events/[eventId]/vendors/[vendorId]/payment');
  }
}