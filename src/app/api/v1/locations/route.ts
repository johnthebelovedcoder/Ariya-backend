import { NextRequest } from 'next/server';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/locations/search - Search locations (cities, venues)
export async function GET(request: NextRequest) {
  try {
    await requireAuthApi(); // Require auth for this endpoint
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // 'city', 'venue', 'all'
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    
    if (query.length < 2) {
      return createApiError('Query must be at least 2 characters', 400);
    }
    
    // In a real implementation, this would query a database or external location service
    // For now, return mock data based on the query
    const mockLocations = [
      {
        id: 'loc-1',
        name: 'Lagos, Nigeria',
        type: 'city',
        country: 'NG',
        region: 'Lagos',
        coordinates: { lat: 6.5244, lng: 3.3792 },
        timezone: 'Africa/Lagos',
        popularity: 5
      },
      {
        id: 'loc-2',
        name: 'Abuja, Nigeria',
        type: 'city',
        country: 'NG',
        region: 'FCT',
        coordinates: { lat: 9.0765, lng: 7.3986 },
        timezone: 'Africa/Lagos',
        popularity: 4
      },
      {
        id: 'loc-3',
        name: 'Eko Atlantic, Lagos',
        type: 'venue',
        country: 'NG',
        region: 'Lagos',
        coordinates: { lat: 6.4526, lng: 3.4029 },
        timezone: 'Africa/Lagos',
        popularity: 3
      }
    ];
    
    // Filter based on query and type
    let filteredLocations = mockLocations.filter(loc => 
      loc.name.toLowerCase().includes(query.toLowerCase())
    );
    
    if (type !== 'all') {
      filteredLocations = filteredLocations.filter(loc => loc.type === type);
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedLocations = filteredLocations.slice(startIndex, startIndex + limit);
    
    return createApiResponse({
      locations: paginatedLocations,
      total: filteredLocations.length,
      page,
      limit,
      totalPages: Math.ceil(filteredLocations.length / limit)
    }, 'Locations search results retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/locations/search');
  }
}