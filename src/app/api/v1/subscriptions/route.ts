import { NextRequest } from 'next/server';
import { SubscriptionService } from '@/lib/subscription-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';
import { SubscriptionPlan, SubscriptionInterval } from '@prisma/client';

// GET /api/subscriptions - Get user's subscription
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const subscription = await SubscriptionService.getUserSubscription(user.id);
    
    if (!subscription) {
      return createApiResponse(null, 'No active subscription found', 404);
    }
    
    return createApiResponse(subscription, 'Subscription retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/subscriptions');
  }
}

// POST /api/subscriptions - Create a new subscription
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['plan', 'interval', 'amount', 'startDate', 'endDate'];
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    // Validate plan
    const validPlans = ['FREE', 'PRO', 'PREMIUM'];
    if (!validPlans.includes(body.plan)) {
      return createApiError('Invalid subscription plan', 400);
    }
    
    // Validate interval
    const validIntervals = ['MONTHLY', 'YEARLY'];
    if (!validIntervals.includes(body.interval)) {
      return createApiError('Invalid subscription interval', 400);
    }
    
    // Validate dates
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return createApiError('Invalid date format', 400);
    }
    
    if (endDate <= startDate) {
      return createApiError('End date must be after start date', 400);
    }
    
    // Validate amount is positive
    if (typeof body.amount !== 'number' || body.amount <= 0) {
      return createApiError('Amount must be a positive number', 400);
    }
    
    const subscription = await SubscriptionService.createSubscription({
      userId: user.id,
      plan: body.plan as SubscriptionPlan,
      interval: body.interval as SubscriptionInterval,
      amount: body.amount,
      startDate,
      endDate,
      isAutoRenew: body.isAutoRenew,
      paymentMethodId: body.paymentMethodId,
    });
    
    return createApiResponse(subscription, 'Subscription created successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/subscriptions');
  }
}