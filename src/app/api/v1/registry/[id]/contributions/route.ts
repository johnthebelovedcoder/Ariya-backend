import { NextRequest } from 'next/server';
import { RegistryService } from '@/lib/registry-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// POST /api/registry/[id]/contributions - Record contribution
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
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['itemId', 'amount', 'contributorName'];
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    // Validate numeric fields
    if (typeof body.amount !== 'number' || body.amount <= 0) {
      return createApiError('Amount must be a positive number', 400);
    }
    
    // Validate payment method if provided
    const validPaymentMethods = ['cash', 'bank_transfer', 'mobile_money', 'card', 'check'];
    if (body.paymentMethod && !validPaymentMethods.includes(body.paymentMethod)) {
      return createApiError(`Invalid payment method. Valid methods: ${validPaymentMethods.join(', ')}`, 400);
    }
    
    const contribution = await RegistryService.recordContribution(
      eventId,
      user.id,
      {
        itemId: body.itemId,
        amount: body.amount,
        contributorName: body.contributorName,
        contributorEmail: body.contributorEmail,
        message: body.message,
        paymentMethod: body.paymentMethod,
        paymentReference: body.paymentReference,
        status: body.status || 'completed' // pending, completed, cancelled
      }
    );
    
    return createApiResponse(contribution, 'Contribution recorded successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/registry/[id]/contributions');
  }
}