import { NextRequest } from 'next/server';
import { PaymentService } from '@/lib/payment-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';
import { PaymentStatus } from '@prisma/client';

// GET /api/payments - Get payments for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return createApiError('Invalid pagination parameters', 400);
    }
    
    const result = await PaymentService.getUserPayments(user.id, page, limit);
    
    return createApiResponse(result, 'Payments retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/payments');
  }
}

// POST /api/payments - Create a new payment
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['bookingId', 'transactionId', 'amount', 'paymentMethod'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    // Validate numeric fields
    if (typeof body.amount !== 'number' || body.amount <= 0) {
      return createApiError('Amount must be a positive number', 400);
    }
    
    const payment = await PaymentService.createPayment({
      bookingId: body.bookingId,
      transactionId: body.transactionId,
      amount: body.amount,
      paymentMethod: body.paymentMethod,
    }, user.id);
    
    return createApiResponse(payment, 'Payment created successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/payments');
  }
}