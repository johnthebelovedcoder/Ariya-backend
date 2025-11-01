import { NextRequest } from 'next/server';
import { PaymentService } from '@/lib/payment-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// POST /api/payments/intent - Create payment intent (Stripe/PayPal)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['bookingId'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    const paymentIntent = await PaymentService.createPaymentIntent(
      body.bookingId,
      user.id,
      {
        returnUrl: body.returnUrl,
        cancelUrl: body.cancelUrl,
        paymentMethod: body.paymentMethod
      }
    );
    
    return createApiResponse(paymentIntent, 'Payment intent created successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/payments/intent');
  }
}