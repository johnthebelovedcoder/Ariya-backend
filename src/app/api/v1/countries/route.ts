import { NextRequest } from 'next/server';
import { CurrencyService } from '@/lib/currency-service';
import { createApiResponse, createApiError } from '@/lib/api-utils';

// GET /api/countries - Get all supported countries for signup
export async function GET(request: NextRequest) {
  try {
    const countries = CurrencyService.getSupportedCountries();
    
    return createApiResponse({
      countries,
      total: countries.length
    }, 'Supported countries retrieved successfully');
  } catch (error: unknown) {
    console.error('Error retrieving countries:', error);
    return createApiError('Failed to retrieve countries', 500);
  }
}