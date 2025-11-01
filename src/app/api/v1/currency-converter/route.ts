import { NextRequest } from 'next/server';
import { CurrencyService } from '@/lib/currency-service';
import { createApiResponse, createApiError } from '@/lib/api-utils';

// GET /api/currency-converter - Convert currency amounts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const amount = parseFloat(searchParams.get('amount') || '0');
    const from = searchParams.get('from') || 'NGN';
    const to = searchParams.get('to') || 'USD';
    
    if (isNaN(amount)) {
      return createApiError('Amount must be a valid number', 400);
    }
    
    if (!from || !to) {
      return createApiError('Both "from" and "to" currency codes are required', 400);
    }
    
    // Validate currencies are supported
    if (!CurrencyService.isCurrencySupported(from)) {
      return createApiError(`Currency "${from}" is not supported`, 400);
    }
    
    if (!CurrencyService.isCurrencySupported(to)) {
      return createApiError(`Currency "${to}" is not supported`, 400);
    }
    
    const convertedAmount = CurrencyService.convertCurrency(amount, from, to);
    const exchangeRate = CurrencyService.getExchangeRate(from, to);
    
    return createApiResponse({
      originalAmount: amount,
      originalCurrency: from,
      convertedAmount: convertedAmount,
      convertedCurrency: to,
      exchangeRate: exchangeRate,
      formattedOriginal: CurrencyService.formatAmount(amount, from),
      formattedConverted: CurrencyService.formatAmount(convertedAmount, to),
    }, 'Currency conversion completed successfully');
  } catch (error: any) {
    console.error('Error converting currency:', error);
    return createApiError('Failed to convert currency', 500);
  }
}