import { NextRequest } from 'next/server';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/locations/nearby - Get nearby locations (radius search)
export async function GET(request: NextRequest) {
  try {
    await requireAuthApi(); // Require auth for this endpoint
    
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseFloat(searchParams.get('radius') || '10'); // in km
    const type = searchParams.get('type') || 'all'; // 'city', 'venue', 'all'
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (!lat || !lng) {
      return createApiError('Latitude and longitude are required', 400);
    }
    
    if (radius <= 0 || radius > 100) {
      return createApiError('Radius must be between 1 and 100 km', 400);
    }
    
    // In a real implementation, this would use a geospatial database query
    // For now, return mock data based on the coordinates
    const mockNearbyLocations = [
      {
        id: 'nearby-1',
        name: 'Eko Atlantic Conference Center',
        type: 'venue',
        distance: 2.5, // km
        address: '2, Victoria Island, Lagos',
        coordinates: { lat: lat + 0.02, lng: lng + 0.01 },
        rating: 4.5
      },
      {
        id: 'nearby-2',
        name: 'The Ven Building',
        type: 'venue',
        distance: 4.2, // km
        address: '3, Oniru, Lagos',
        coordinates: { lat: lat - 0.01, lng: lng - 0.02 },
        rating: 4.2
      },
      {
        id: 'nearby-3',
        name: 'Lekki Phase 1',
        type: 'city',
        distance: 7.8, // km
        address: 'Lekki, Lagos',
        coordinates: { lat: lat + 0.05, lng: lng + 0.03 },
        rating: 4.0
      }
    ];
    
    // Filter by type if specified
    let filteredLocations = mockNearbyLocations;
    if (type !== 'all') {
      filteredLocations = mockNearbyLocations.filter(loc => loc.type === type);
    }
    
    // Apply radius filter
    filteredLocations = filteredLocations.filter(loc => loc.distance <= radius);
    
    // Apply limit
    const limitedLocations = filteredLocations.slice(0, limit);
    
    return createApiResponse({
      locations: limitedLocations,
      total: limitedLocations.length,
      center: { lat, lng },
      radius,
      unit: 'km'
    }, 'Nearby locations retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/locations/nearby');
  }
}