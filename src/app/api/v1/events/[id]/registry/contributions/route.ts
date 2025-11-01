import { NextRequest } from 'next/server';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// POST /api/events/[eventId]/registry/contributions - Record contribution
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
    
    // Verify user has access to the event
    const eventExists = true; // Placeholder
    
    if (!eventExists) {
      return createApiError('Event not found or you do not have permission', 404);
    }
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['itemId', 'amount'];
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    // Validate item ID
    if (typeof body.itemId !== 'string' || body.itemId.trim().length === 0) {
      return createApiError('Item ID must be a non-empty string', 400);
    }
    
    // Validate amount
    if (typeof body.amount !== 'number' || body.amount <= 0) {
      return createApiError('Amount must be a positive number', 400);
    }
    
    // Validate contributor name if provided
    if (body.contributorName !== undefined) {
      if (typeof body.contributorName !== 'string' || body.contributorName.trim().length === 0) {
        return createApiError('Contributor name must be a non-empty string', 400);
      }
    }
    
    // Validate message if provided
    if (body.message !== undefined && typeof body.message !== 'string') {
      return createApiError('Message must be a string', 400);
    }
    
    // Validate anonymous flag if provided
    if (body.anonymous !== undefined && typeof body.anonymous !== 'boolean') {
      return createApiError('Anonymous must be a boolean', 400);
    }
    
    // In a real implementation, this would:
    // 1. Verify the registry item exists
    // 2. Verify the amount matches item price or partial payment rules
    // 3. Update item purchased/reserved counts
    // 4. Record the contribution
    // 5. Send notifications to event owners
    // For now, return mock contribution
    
    const newContribution = {
      id: `contrib_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventId,
      itemId: body.itemId,
      amount: body.amount,
      currency: body.currency || 'NGN',
      contributorName: body.contributorName || 'Anonymous Guest',
      contributorEmail: body.contributorEmail || null,
      message: body.message || null,
      anonymous: body.anonymous || false,
      transactionId: body.transactionId || `txn_${Date.now()}`,
      paymentMethod: body.paymentMethod || 'card',
      status: 'completed',
      timestamp: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return createApiResponse(newContribution, 'Contribution recorded successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/events/[eventId]/registry/contributions');
  }
}

// GET /api/events/[eventId]/registry/contributions - Get contribution history
export async function GET(
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
    
    // Verify user has access to the event
    const eventExists = true; // Placeholder
    
    if (!eventExists) {
      return createApiError('Event not found or you do not have permission', 404);
    }
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const itemId = searchParams.get('itemId') || undefined;
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 50) {
      return createApiError('Invalid pagination parameters. Limit must be between 1-50', 400);
    }
    
    // In a real implementation, this would fetch contributions from a database
    // For now, return mock contribution history
    
    // Generate mock contributions
    const mockContributions = Array.from({ length: 35 }, (_, index) => ({
      id: `contrib_${eventId}_${index + 1}`,
      eventId,
      itemId: `item_${Math.floor(index / 3) + 1}`,
      amount: Math.floor(Math.random() * 50000) + 5000, // Random amount between 5,000-55,000
      currency: 'NGN',
      contributorName: index % 3 === 0 ? 'Anonymous Guest' : `Contributor ${index + 1}`,
      contributorEmail: index % 4 === 0 ? null : `contributor${index + 1}@example.com`,
      message: index % 5 === 0 ? null : `Happy to contribute to your special day! Here's to many years of happiness together.`,
      anonymous: index % 3 === 0,
      transactionId: `txn_${Date.now()}_${index}`,
      paymentMethod: ['card', 'bank_transfer', 'paypal'][Math.floor(Math.random() * 3)],
      status: 'completed',
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    // Apply filters
    let filteredContributions = mockContributions;
    
    if (itemId) {
      filteredContributions = filteredContributions.filter(contrib => contrib.itemId === itemId);
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedContributions = filteredContributions.slice(startIndex, startIndex + limit);
    
    // Calculate totals
    const totalAmount = filteredContributions.reduce((sum, contrib) => sum + contrib.amount, 0);
    const totalCount = filteredContributions.length;
    
    return createApiResponse({
      contributions: paginatedContributions,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      summary: {
        totalAmount,
        currency: 'NGN',
        totalContributions: totalCount,
        averageContribution: totalCount > 0 ? Math.round(totalAmount / totalCount) : 0
      },
      filters: {
        itemId
      }
    }, 'Contribution history retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/events/[eventId]/registry/contributions');
  }
}