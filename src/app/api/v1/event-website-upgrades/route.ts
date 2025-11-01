import { NextRequest } from 'next/server';
import { EventWebsiteUpgradeService } from '@/lib/event-website-upgrade-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/event-website-upgrades - Get event website upgrades
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    
    if (!eventId) {
      return createApiError('eventId is required', 400);
    }
    
    const upgrades = await EventWebsiteUpgradeService.getEventWebsiteUpgrades(eventId, user.id);
    
    return createApiResponse(upgrades, 'Event website upgrades retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/event-website-upgrades');
  }
}

// POST /api/event-website-upgrades - Create a new event website upgrade
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['eventId', 'type', 'amount'];
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    // Validate type
    const validTypes = ['CUSTOM_DOMAIN', 'PREMIUM_TEMPLATE', 'ADDITIONAL_STORAGE'];
    if (!validTypes.includes(body.type)) {
      return createApiError('Invalid website upgrade type', 400);
    }
    
    // Validate amount is positive
    if (typeof body.amount !== 'number' || body.amount <= 0) {
      return createApiError('Amount must be a positive number', 400);
    }
    
    const upgrade = await EventWebsiteUpgradeService.createEventWebsiteUpgrade({
      eventId: body.eventId,
      type: body.type,
      amount: body.amount,
      paymentStatus: body.paymentStatus,
      details: body.details,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    }, user.id);
    
    return createApiResponse(upgrade, 'Event website upgrade created successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/event-website-upgrades');
  }
}