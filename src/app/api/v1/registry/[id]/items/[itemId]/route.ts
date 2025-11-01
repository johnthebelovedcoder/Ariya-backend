import { NextRequest } from 'next/server';
import { RegistryService } from '@/lib/registry-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// Helper to extract item ID from URL
function getItemIdFromUrl(url: string): string | null {
  // Extract itemId from URL - pattern: /api/registry/[eventId]/items/[itemId]
  const match = url.match(/\/api\/registry\/[^\/]+\/items\/([^\/\?]+)/);
  return match ? match[1] : null;
}

// PUT /api/registry/[eventId]/items/[itemId] - Update registry item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: eventId } = params;
    const itemId = getItemIdFromUrl(request.url);
    
    if (!eventId || !itemId) {
      return createApiError('Event ID and Item ID are required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    // Validate numeric fields if provided
    if (body.price !== undefined && (typeof body.price !== 'number' || body.price < 0)) {
      return createApiError('Price must be a non-negative number', 400);
    }
    
    if (body.quantity !== undefined && (typeof body.quantity !== 'number' || body.quantity < 0)) {
      return createApiError('Quantity must be a non-negative number', 400);
    }
    
    const registryItem = await RegistryService.updateRegistryItem(
      eventId,
      itemId,
      user.id,
      {
        name: body.name,
        description: body.description,
        price: body.price,
        link: body.link,
        quantity: body.quantity,
        purchasedQuantity: body.purchasedQuantity,
        category: body.category
      }
    );
    
    return createApiResponse(registryItem, 'Registry item updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/registry/[eventId]/items/[itemId]');
  }
}

// DELETE /api/registry/[eventId]/items/[itemId] - Delete registry item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: eventId } = params;
    const itemId = getItemIdFromUrl(request.url);
    
    if (!eventId || !itemId) {
      return createApiError('Event ID and Item ID are required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    await RegistryService.deleteRegistryItem(eventId, itemId, user.id);
    
    return createApiResponse(null, 'Registry item deleted successfully');
  } catch (error: any) {
    return handleApiError(error, 'DELETE /api/registry/[eventId]/items/[itemId]');
  }
}