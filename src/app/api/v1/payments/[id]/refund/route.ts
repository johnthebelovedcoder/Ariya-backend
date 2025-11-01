import { NextRequest } from 'next/server';
import { PaymentService } from '@/lib/payment-service';
import { requireAuthApi, requireRoleAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// POST /api/payments/[paymentId]/refund - Process refund
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: paymentId } = params;
    
    if (!paymentId) {
      return createApiError('Payment ID is required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Validate request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.amount) {
      return createApiError('amount is required for refund', 400);
    }
    
    // Validate amount
    if (typeof body.amount !== 'number' || body.amount <= 0) {
      return createApiError('Amount must be a positive number', 400);
    }
    
    if (body.amount > body.maxRefundableAmount && body.maxRefundableAmount !== undefined) {
      return createApiError('Refund amount exceeds maximum refundable amount', 400);
    }
    
    // Check if user has the right permissions to process refund
    // Only admins, or users with specific roles, or users who made the payment can refund
    const payment = await PaymentService.getPaymentById(paymentId, user.id);
    if (!payment) {
      return createApiError('Payment not found or you do not have permission', 404);
    }
    
    // If it's not the payment creator, check if they are an admin
    if (payment.userId !== user.id) {
      const adminResult = await requireRoleAuthApi(['ADMIN']);
      if (!('session' in adminResult)) {
        return createApiError('You do not have permission to process this refund', 403);
      }
    }
    
    const refundResult = await PaymentService.processRefund(
      paymentId,
      user.id,
      body.amount,
      {
        reason: body.reason || 'Customer request',
        refundMethod: body.refundMethod,
        notes: body.notes
      }
    );
    
    return createApiResponse(refundResult, 'Refund processed successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/payments/[paymentId]/refund');
  }
}