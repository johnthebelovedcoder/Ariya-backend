import { NextRequest } from 'next/server';
import { CurrencyService } from '@/lib/currency-service';
import { requireAuthApi, createApiResponse, createApiError } from '@/lib/api-utils';
import prisma from '@/lib/prisma';

// GET /api/user/preferences - Get current user's country and currency preferences
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const userWithPreferences = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        country: true,
        currency: true,
        timezone: true,
        preferredLocale: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!userWithPreferences) {
      return createApiError('User not found', 404);
    }
    
    // If no preferences set, return default values
    const preferences = {
      country: userWithPreferences.country || 'NG', // Default to Nigeria
      currency: userWithPreferences.currency || 'NGN', // Default to Nigerian Naira
      timezone: userWithPreferences.timezone || 'Africa/Lagos',
      locale: userWithPreferences.preferredLocale || 'en-NG',
      paymentMethods: CurrencyService.getPaymentMethodsForCountry(userWithPreferences.country || 'NG')
    };
    
    return createApiResponse(preferences, 'User preferences retrieved successfully');
  } catch (error: any) {
    console.error('Error retrieving user preferences:', error);
    return createApiError('Failed to retrieve user preferences', 500);
  }
}

// PUT /api/user/preferences - Update current user's country and currency preferences
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.country) {
      return createApiError('Country is required', 400);
    }
    
    // Validate country is supported
    if (!CurrencyService.isCountrySupported(body.country)) {
      return createApiError('Country not supported', 400);
    }
    
    // If currency is provided, validate it
    if (body.currency && !CurrencyService.isCurrencySupported(body.currency)) {
      return createApiError('Currency not supported', 400);
    }
    
    // If no currency provided, use the country's default currency
    const currency = body.currency || CurrencyService.getCountryByCode(body.country)?.currency || 'NGN';
    
    // Update user preferences
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        country: body.country,
        currency: currency,
        timezone: body.timezone || CurrencyService.getCountryByCode(body.country)?.timezone,
        preferredLocale: body.preferredLocale || CurrencyService.getLocaleForCountry(body.country)
      },
      select: {
        id: true,
        country: true,
        currency: true,
        timezone: true,
        preferredLocale: true,
        updatedAt: true
      }
    });
    
    return createApiResponse(updatedUser, 'User preferences updated successfully');
  } catch (error: any) {
    console.error('Error updating user preferences:', error);
    return createApiError('Failed to update user preferences', 500);
  }
}