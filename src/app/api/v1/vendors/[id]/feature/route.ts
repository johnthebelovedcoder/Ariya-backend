import { NextRequest } from 'next/server';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';
import prisma from '@/lib/prisma';

// POST /api/vendors/:vendorId/feature - Purchase featured listing
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: vendorId } = params;
    
    if (!vendorId) {
      return createApiError('Vendor ID is required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Verify that the authenticated user owns the vendor profile
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId }
    });
    
    if (!vendor) {
      return createApiError('Vendor not found', 404);
    }
    
    if (vendor.userId !== user.id) {
      return createApiError('You do not have permission to purchase features for this vendor', 403);
    }
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['type', 'duration', 'paymentMethodId'];
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return createApiError(`${field} is required for feature purchase`, 400);
      }
    }
    
    // Validate type
    const validTypes = ['TOP_SPOT_IN_CATEGORY', 'BOOSTED_SEARCH_RESULT'];
    if (!validTypes.includes(body.type)) {
      return createApiError('Invalid featured listing type', 400);
    }
    
    // Validate duration
    if (typeof body.duration !== 'number' || body.duration <= 0) {
      return createApiError('Duration must be a positive number', 400);
    }
    
    // In a real implementation, this would process the purchase
    // For now, return mock purchase result
    const purchaseResult = {
      vendorId,
      featureId: `feat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: body.type,
      duration: body.duration, // days
      amount: 15000, // mock price
      currency: 'NGN',
      startDate: new Date(),
      endDate: new Date(Date.now() + body.duration * 24 * 60 * 60 * 1000),
      status: 'active',
      paymentMethodId: body.paymentMethodId,
      purchasedAt: new Date(),
      confirmationCode: `CONF_${Math.random().toString(36).substr(2, 10).toUpperCase()}`
    };
    
    return createApiResponse(purchaseResult, 'Featured listing purchased successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/vendors/[vendorId]/feature');
  }
}