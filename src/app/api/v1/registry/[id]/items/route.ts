import { NextRequest } from 'next/server';
import { RegistryService } from '@/lib/registry-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// POST /api/registry/[id]/items - Add registry item
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
    const requiredFields = ['name', 'price'];
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    // Validate numeric fields
    if (typeof body.price !== 'number' || body.price < 0) {
      return createApiError('Price must be a non-negative number', 400);
    }
    
    if (body.quantity && (typeof body.quantity !== 'number' || body.quantity < 0)) {
      return createApiError('Quantity must be a non-negative number', 400);
    }
    
    const registryItem = await RegistryService.addRegistryItem(
      eventId,
      user.id,
      {
        name: body.name,
        description: body.description,
        price: body.price,
        link: body.link,
        quantity: body.quantity,
        purchasedQuantity: body.purchasedQuantity || 0,
        category: body.category
      }
    );
    
    return createApiResponse(registryItem, 'Registry item added successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/registry/[id]/items');
  }
}