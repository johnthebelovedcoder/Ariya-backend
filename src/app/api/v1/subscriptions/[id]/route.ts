import { NextRequest } from 'next/server';
import { SubscriptionService } from '@/lib/subscription-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';
import { SubscriptionStatus } from '@prisma/client';

// PUT /api/subscriptions - Update user's subscription
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    // Get the user's subscription
    const currentSubscription = await SubscriptionService.getUserSubscription(user.id);
    
    if (!currentSubscription) {
      return createApiError('No active subscription found', 404);
    }
    
    const subscription = await SubscriptionService.updateSubscription(
      currentSubscription.id,
      user.id,
      {
        plan: body.plan,
        interval: body.interval,
        amount: body.amount,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        isAutoRenew: body.isAutoRenew,
        status: body.status as SubscriptionStatus,
      }
    );
    
    return createApiResponse(subscription, 'Subscription updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/subscriptions');
  }
}

// DELETE /api/subscriptions - Cancel user's subscription
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Get the user's subscription
    const currentSubscription = await SubscriptionService.getUserSubscription(user.id);
    
    if (!currentSubscription) {
      return createApiError('No active subscription found', 404);
    }
    
    const subscription = await SubscriptionService.cancelSubscription(
      currentSubscription.id,
      user.id
    );
    
    return createApiResponse(subscription, 'Subscription cancelled successfully');
  } catch (error: any) {
    return handleApiError(error, 'DELETE /api/subscriptions');
  }
}