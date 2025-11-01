import { NextRequest } from 'next/server';
import { PaymentService } from '@/lib/payment-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';
import { PaymentStatus } from '@prisma/client';

// GET /api/payments/[id] - Get payment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return createApiError('Payment ID is required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const payment = await PaymentService.getPaymentById(id, user.id);
    
    if (!payment) {
      return createApiError('Payment not found or you do not have permission to access it', 404);
    }
    
    return createApiResponse(payment, 'Payment retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/payments/[id]');
  }
}

// PUT /api/payments/[id] - Update payment by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return createApiError('Payment ID is required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    // Validate numeric fields if provided
    if (body.amount !== undefined && (typeof body.amount !== 'number' || body.amount <= 0)) {
      return createApiError('Amount must be a positive number', 400);
    }
    
    const payment = await PaymentService.updatePayment(id, user.id, {
      status: body.status,
      transactionId: body.transactionId,
      amount: body.amount,
      paymentMethod: body.paymentMethod,
    });
    
    return createApiResponse(payment, 'Payment updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/payments/[id]');
  }
}

// DELETE /api/payments/[id] - Delete payment by ID (only for pending payments)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return createApiError('Payment ID is required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Note: In a real application, you typically wouldn't allow deleting payments
    // Instead, you might want to cancel or refund them
    // For demonstration purposes, I'll show how to implement this:
    const payment = await PaymentService.getPaymentById(id, user.id);
    
    if (!payment) {
      return createApiError('Payment not found or you do not have permission to access it', 404);
    }
    
    // For this implementation, we'll return an error since deleting payments
    // is typically not allowed in financial applications
    return createApiError('Deleting payments is not allowed. Payments can only be refunded', 400);
  } catch (error: any) {
    return handleApiError(error, 'DELETE /api/payments/[id]');
  }
}