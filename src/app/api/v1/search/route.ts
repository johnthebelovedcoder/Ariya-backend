import { NextRequest } from 'next/server';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/search/suggestions - Get search suggestions (autocomplete)
export async function GET(request: NextRequest) {
  try {
    await requireAuthApi(); // Require auth for this endpoint
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // 'vendor', 'event', 'location', 'all'
    
    if (query.length < 1) {
      return createApiError('Query is required', 400);
    }
    
    // In a real implementation, this would query a search index
    // For now, return mock suggestions based on the query
    const mockSuggestions = [
      { id: 'sug-1', text: 'Wedding Venues in Lagos', type: 'vendor' },
      { id: 'sug-2', text: 'Caterers for Birthday Party', type: 'vendor' },
      { id: 'sug-3', text: 'Elegant Wedding Decorators', type: 'vendor' },
      { id: 'sug-4', text: 'Conference Hall Abuja', type: 'location' },
      { id: 'sug-5', text: 'Beach Wedding Locations', type: 'location' }
    ];
    
    // Filter based on query and type
    let filteredSuggestions = mockSuggestions.filter(sug => 
      sug.text.toLowerCase().includes(query.toLowerCase())
    );
    
    if (type !== 'all') {
      filteredSuggestions = filteredSuggestions.filter(sug => sug.type === type);
    }
    
    // Limit to top 5 suggestions
    const limitedSuggestions = filteredSuggestions.slice(0, 5);
    
    return createApiResponse({
      suggestions: limitedSuggestions,
      total: limitedSuggestions.length,
      query
    }, 'Search suggestions retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/search/suggestions');
  }
}