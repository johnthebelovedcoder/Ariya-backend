import { NextRequest } from 'next/server';
import { PaymentService } from '@/lib/payment-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// POST /api/payments/process - Process payment
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['paymentIntentId', 'paymentMethod', 'amount'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    // Validate amount
    if (typeof body.amount !== 'number' || body.amount <= 0) {
      return createApiError('Amount must be a positive number', 400);
    }
    
    const payment = await PaymentService.processPayment(
      body.paymentIntentId,
      body.paymentMethod,
      body.amount,
      user.id,
      {
        paymentToken: body.paymentToken,
        returnUrl: body.returnUrl,
        clientSecret: body.clientSecret
      }
    );
    
    return createApiResponse(payment, 'Payment processed successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/payments/process');
  }
}