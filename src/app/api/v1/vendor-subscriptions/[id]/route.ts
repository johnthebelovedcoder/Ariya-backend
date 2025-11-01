import { NextRequest } from 'next/server';
import { SubscriptionService } from '@/lib/subscription-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';
import { SubscriptionStatus } from '@prisma/client';
import prisma from '@/lib/prisma';

// PUT /api/vendor-subscriptions - Update vendor's subscription
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Get vendor ID based on user ID
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user.id }
    });
    
    if (!vendor) {
      return createApiError('User does not have a vendor profile', 400);
    }
    
    const body = await request.json();
    
    // Get the vendor's subscription
    const currentSubscription = await SubscriptionService.getVendorSubscription(vendor.id);
    
    if (!currentSubscription) {
      return createApiError('No active subscription found', 404);
    }
    
    const subscription = await SubscriptionService.updateVendorSubscription(
      currentSubscription.id,
      vendor.id,
      {
        plan: body.plan,
        interval: body.interval,
        amount: body.amount,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        isAutoRenew: body.isAutoRenew,
        status: body.status as SubscriptionStatus,
      }
    );
    
    return createApiResponse(subscription, 'Vendor subscription updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/vendor-subscriptions');
  }
}

// DELETE /api/vendor-subscriptions - Cancel vendor's subscription
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Get vendor ID based on user ID
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user.id }
    });
    
    if (!vendor) {
      return createApiError('User does not have a vendor profile', 400);
    }
    
    // Get the vendor's subscription
    const currentSubscription = await SubscriptionService.getVendorSubscription(vendor.id);
    
    if (!currentSubscription) {
      return createApiError('No active subscription found', 404);
    }
    
    const subscription = await SubscriptionService.cancelVendorSubscription(
      currentSubscription.id,
      vendor.id
    );
    
    return createApiResponse(subscription, 'Vendor subscription cancelled successfully');
  } catch (error: any) {
    return handleApiError(error, 'DELETE /api/vendor-subscriptions');
  }
}