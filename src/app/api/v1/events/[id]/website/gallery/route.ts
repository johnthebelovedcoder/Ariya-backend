import { NextRequest } from 'next/server';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// POST /api/events/[eventId]/website/gallery - Upload photos to gallery
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
    
    // In a real implementation, this would process file uploads
    // For now, accepting gallery items via request body
    const body = await request.json();
    
    if (!body.photos || !Array.isArray(body.photos) || body.photos.length === 0) {
      return createApiError('Photos array is required and cannot be empty', 400);
    }
    
    // Validate photo URLs
    for (const photo of body.photos) {
      if (typeof photo !== 'string' || photo.trim().length === 0) {
        return createApiError('Each photo must be a non-empty string URL', 400);
      }
      
      // Basic URL validation
      try {
        new URL(photo);
      } catch {
        return createApiError('Invalid photo URL format', 400);
      }
    }
    
    // In a real implementation, this would:
    // 1. Process uploaded files
    // 2. Optimize images
    // 3. Store in cloud storage
    // 4. Add to event gallery
    // For now, return mock response
    
    const uploadedPhotos = body.photos.map((photoUrl: string, index: number) => ({
      id: `photo_${Date.now()}_${index}`,
      eventId,
      url: photoUrl,
      thumbnailUrl: photoUrl.replace(/\.(jpg|jpeg|png|gif)$/i, '_thumb.$1'),
      caption: body.captions?.[index] || '',
      uploadedAt: new Date().toISOString(),
      order: index
    }));
    
    return createApiResponse({
      photos: uploadedPhotos,
      total: uploadedPhotos.length,
      eventId
    }, 'Photos uploaded to gallery successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/events/[eventId]/website/gallery');
  }
}

// GET /api/events/[eventId]/website/gallery - Get gallery photos
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
    const limit = parseInt(searchParams.get('limit') || '12');
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 50) {
      return createApiError('Invalid pagination parameters. Limit must be between 1-50', 400);
    }
    
    // In a real implementation, this would fetch gallery photos from a database
    // For now, return mock gallery data
    
    // Generate mock photos
    const mockPhotos = Array.from({ length: 24 }, (_, index) => ({
      id: `photo_${eventId}_${index + 1}`,
      eventId,
      url: `https://example.com/gallery/${eventId}/photo-${index + 1}.jpg`,
      thumbnailUrl: `https://example.com/gallery/${eventId}/photo-${index + 1}_thumb.jpg`,
      caption: `Event moment ${index + 1}`,
      uploadedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
      order: index
    }));
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedPhotos = mockPhotos.slice(startIndex, startIndex + limit);
    
    return createApiResponse({
      photos: paginatedPhotos,
      pagination: {
        page,
        limit,
        total: mockPhotos.length,
        pages: Math.ceil(mockPhotos.length / limit)
      },
      eventId
    }, 'Gallery photos retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/events/[eventId]/website/gallery');
  }
}