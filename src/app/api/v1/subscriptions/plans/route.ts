import { NextRequest } from 'next/server';
import { SubscriptionService } from '@/lib/subscription-service';
import { createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/subscriptions/plans - Get available subscription plans
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    
    const plans = await SubscriptionService.getAvailablePlans(includeInactive);
    
    return createApiResponse(plans, 'Subscription plans retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/subscriptions/plans');
  }
}