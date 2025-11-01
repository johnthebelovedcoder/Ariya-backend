import { NextRequest } from 'next/server';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// POST /api/events/[eventId]/registry/items - Add registry item
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
    const requiredFields = ['name', 'price'];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    // Validate price
    if (typeof body.price !== 'number' || body.price <= 0) {
      return createApiError('Price must be a positive number', 400);
    }
    
    // Validate name
    if (typeof body.name !== 'string' || body.name.trim().length === 0) {
      return createApiError('Name must be a non-empty string', 400);
    }
    
    // Validate currency if provided
    if (body.currency !== undefined) {
      if (typeof body.currency !== 'string' || body.currency.trim().length === 0) {
        return createApiError('Currency must be a non-empty string', 400);
      }
    }
    
    // Validate quantity if provided
    if (body.quantity !== undefined) {
      if (typeof body.quantity !== 'number' || body.quantity < 0 || !Number.isInteger(body.quantity)) {
        return createApiError('Quantity must be a non-negative integer', 400);
      }
    }
    
    // Validate priority if provided
    if (body.priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(body.priority)) {
        return createApiError(`Priority must be one of: ${validPriorities.join(', ')}`, 400);
      }
    }
    
    // In a real implementation, this would create a registry item in the database
    // For now, return mock registry item
    
    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventId,
      name: body.name.trim(),
      description: body.description ? body.description.trim() : '',
      price: body.price,
      currency: body.currency || 'NGN',
      quantity: body.quantity || 1,
      priority: body.priority || 'medium',
      imageUrl: body.imageUrl || null,
      storeUrl: body.storeUrl || null,
      category: body.category || 'General',
      notes: body.notes || '',
      purchased: 0, // Number of items purchased
      reserved: 0, // Number of items reserved by guests
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return createApiResponse(newItem, 'Registry item added successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/events/[eventId]/registry/items');
  }
}

// GET /api/events/[eventId]/registry/items - List registry items
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
    const category = searchParams.get('category') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const purchased = searchParams.get('purchased') || undefined; // 'yes', 'no', 'partial'
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 50) {
      return createApiError('Invalid pagination parameters. Limit must be between 1-50', 400);
    }
    
    // In a real implementation, this would fetch registry items from a database
    // For now, return mock registry items
    
    // Generate mock items
    const mockItems = Array.from({ length: 25 }, (_, index) => ({
      id: `item_${eventId}_${index + 1}`,
      eventId,
      name: `Registry Item ${index + 1}`,
      description: `Description for registry item ${index + 1}`,
      price: Math.floor(Math.random() * 100000) + 5000, // Random price between 5,000-105,000
      currency: 'NGN',
      quantity: Math.floor(Math.random() * 5) + 1, // Random quantity between 1-5
      priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      imageUrl: `https://example.com/images/item-${index + 1}.jpg`,
      storeUrl: `https://example.com/store/item-${index + 1}`,
      category: ['Kitchen', 'Bedroom', 'Living Room', 'Dining', 'Bathroom', 'General'][Math.floor(Math.random() * 6)],
      notes: `Special notes for item ${index + 1}`,
      purchased: Math.floor(Math.random() * 3), // Random purchased count between 0-2
      reserved: Math.floor(Math.random() * 2), // Random reserved count between 0-1
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    // Apply filters
    let filteredItems = mockItems;
    
    if (category) {
      filteredItems = filteredItems.filter(item => 
        item.category.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    if (priority) {
      filteredItems = filteredItems.filter(item => item.priority === priority);
    }
    
    if (purchased === 'yes') {
      filteredItems = filteredItems.filter(item => item.purchased >= item.quantity);
    } else if (purchased === 'no') {
      filteredItems = filteredItems.filter(item => item.purchased === 0);
    } else if (purchased === 'partial') {
      filteredItems = filteredItems.filter(item => item.purchased > 0 && item.purchased < item.quantity);
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedItems = filteredItems.slice(startIndex, startIndex + limit);
    
    return createApiResponse({
      items: paginatedItems,
      pagination: {
        page,
        limit,
        total: filteredItems.length,
        pages: Math.ceil(filteredItems.length / limit)
      },
      filters: {
        category,
        priority,
        purchased
      }
    }, 'Registry items retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/events/[eventId]/registry/items');
  }
}