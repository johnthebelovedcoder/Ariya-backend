import { NextRequest } from 'next/server';
import { CurrencyService } from '@/lib/currency-service';
import { createApiResponse, createApiError } from '@/lib/api-utils';

// GET /api/currency - Get all supported currencies
export async function GET(request: NextRequest) {
  try {
    const currencies = CurrencyService.getSupportedCurrencies();
    
    return createApiResponse({
      currencies,
      total: currencies.length
    }, 'Supported currencies retrieved successfully');
  } catch (error: unknown) {
    console.error('Error retrieving currencies:', error);
    return createApiError('Failed to retrieve currencies', 500);
  }
}