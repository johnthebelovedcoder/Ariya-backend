import { NextRequest } from 'next/server';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// Helper to extract item ID from URL
function getItemIdFromUrl(url: string): string | null {
  // Extract itemId from URL - pattern: /api/events/[eventId]/registry/items/[itemId]
  const match = url.match(/\/api\/events\/[^\/]+\/registry\/items\/([^\/\?]+)/);
  return match ? match[1] : null;
}

// GET /api/events/[eventId]/registry/items/[itemId] - Get registry item
export async function GET(
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
    
    // Verify user has access to the event
    const eventExists = true; // Placeholder
    
    if (!eventExists) {
      return createApiError('Event not found or you do not have permission', 404);
    }
    
    // In a real implementation, this would fetch the registry item from a database
    // For now, return mock registry item
    
    const mockItem = {
      id: itemId,
      eventId,
      name: 'Premium Dinnerware Set',
      description: 'Elegant 12-piece dinnerware set with gold accents',
      price: 75000,
      currency: 'NGN',
      quantity: 2,
      priority: 'high',
      imageUrl: 'https://example.com/images/dinnerware-set.jpg',
      storeUrl: 'https://example.com/store/dinnerware-set',
      category: 'Dining',
      notes: 'Looking for white porcelain with subtle gold detailing',
      purchased: 0,
      reserved: 1,
      contributors: [
        {
          id: 'contributor-1',
          name: 'John Smith',
          amount: 30000,
          date: new Date().toISOString(),
          message: 'Happy to contribute to your new home!'
        }
      ],
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return createApiResponse(mockItem, 'Registry item retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/events/[eventId]/registry/items/[itemId]');
  }
}

// PUT /api/events/[eventId]/registry/items/[itemId] - Update registry item
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
    
    // Verify user has access to the event
    const eventExists = true; // Placeholder
    
    if (!eventExists) {
      return createApiError('Event not found or you do not have permission', 404);
    }
    
    const body = await request.json();
    
    // Validate update fields
    const validFields = ['name', 'description', 'price', 'currency', 'quantity', 'priority', 'imageUrl', 'storeUrl', 'category', 'notes'];
    const invalidFields = Object.keys(body).filter(field => !validFields.includes(field));
    
    if (invalidFields.length > 0) {
      return createApiError(`Invalid fields: ${invalidFields.join(', ')}. Valid fields are: ${validFields.join(', ')}`, 400);
    }
    
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return createApiError('Name must be a non-empty string', 400);
      }
    }
    
    if (body.price !== undefined) {
      if (typeof body.price !== 'number' || body.price <= 0) {
        return createApiError('Price must be a positive number', 400);
      }
    }
    
    if (body.currency !== undefined) {
      if (typeof body.currency !== 'string' || body.currency.trim().length === 0) {
        return createApiError('Currency must be a non-empty string', 400);
      }
    }
    
    if (body.quantity !== undefined) {
      if (typeof body.quantity !== 'number' || body.quantity < 0 || !Number.isInteger(body.quantity)) {
        return createApiError('Quantity must be a non-negative integer', 400);
      }
    }
    
    const validPriorities = ['low', 'medium', 'high'];
    if (body.priority !== undefined && !validPriorities.includes(body.priority)) {
      return createApiError(`Priority must be one of: ${validPriorities.join(', ')}`, 400);
    }
    
    if (body.imageUrl !== undefined) {
      if (body.imageUrl !== null && typeof body.imageUrl !== 'string') {
        return createApiError('Image URL must be a string or null', 400);
      }
      
      if (body.imageUrl) {
        try {
          new URL(body.imageUrl);
        } catch {
          return createApiError('Invalid image URL format', 400);
        }
      }
    }
    
    if (body.storeUrl !== undefined) {
      if (body.storeUrl !== null && typeof body.storeUrl !== 'string') {
        return createApiError('Store URL must be a string or null', 400);
      }
      
      if (body.storeUrl) {
        try {
          new URL(body.storeUrl);
        } catch {
          return createApiError('Invalid store URL format', 400);
        }
      }
    }
    
    if (body.category !== undefined) {
      if (typeof body.category !== 'string' || body.category.trim().length === 0) {
        return createApiError('Category must be a non-empty string', 400);
      }
    }
    
    // Update registry item
    const updatedItem = {
      id: itemId,
      eventId,
      name: body.name !== undefined ? body.name.trim() : 'Premium Dinnerware Set',
      description: body.description !== undefined ? body.description.trim() : 'Elegant 12-piece dinnerware set with gold accents',
      price: body.price !== undefined ? body.price : 75000,
      currency: body.currency || 'NGN',
      quantity: body.quantity !== undefined ? body.quantity : 2,
      priority: body.priority || 'high',
      imageUrl: body.imageUrl || 'https://example.com/images/dinnerware-set.jpg',
      storeUrl: body.storeUrl || 'https://example.com/store/dinnerware-set',
      category: body.category || 'Dining',
      notes: body.notes || 'Looking for white porcelain with subtle gold detailing',
      updatedAt: new Date().toISOString()
    };
    
    return createApiResponse(updatedItem, 'Registry item updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/events/[eventId]/registry/items/[itemId]');
  }
}

// DELETE /api/events/[eventId]/registry/items/[itemId] - Delete registry item
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
    
    // Verify user has access to the event
    const eventExists = true; // Placeholder
    
    if (!eventExists) {
      return createApiError('Event not found or you do not have permission', 404);
    }
    
    // In a real implementation, this would delete the registry item from a database
    // For now, return success response
    
    return createApiResponse(null, 'Registry item deleted successfully', 204);
  } catch (error: any) {
    return handleApiError(error, 'DELETE /api/events/[eventId]/registry/items/[itemId]');
  }
}