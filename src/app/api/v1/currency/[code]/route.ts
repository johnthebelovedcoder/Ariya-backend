import { NextRequest } from 'next/server';
import { CurrencyService } from '@/lib/currency-service';
import { createApiResponse, createApiError } from '@/lib/api-utils';

// Helper to extract currency code from URL
function getCurrencyCodeFromUrl(url: string): string | null {
  // Extract currency code from URL - expecting format like /api/currency/[code]
  const match = url.match(/\/api\/currency\/([^\/\?]+)/);
  return match ? match[1] : null;
}

// GET /api/currency/[code] - Get information about a specific currency
export async function GET(request: NextRequest) {
  try {
    const currencyCode = getCurrencyCodeFromUrl(request.url);
    
    if (!currencyCode) {
      return createApiError('Currency code is required', 400);
    }
    
    const currencyInfo = CurrencyService.getCurrencyByCode(currencyCode);
    
    if (!currencyInfo) {
      return createApiError('Currency not supported', 404);
    }
    
    return createApiResponse(currencyInfo, 'Currency information retrieved successfully');
  } catch (error: any) {
    console.error('Error retrieving currency info:', error);
    return createApiError('Failed to retrieve currency information', 500);
  }
}