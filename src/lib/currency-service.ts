// Global currency and country information for Ariya platform
import { EnhancedCurrencyService } from './enhanced-currency-service';

export interface CountryInfo {
  code: string;        // ISO 3166-1 alpha-2 country code
  name: string;
  currency: string;    // ISO 4217 currency code
  currencyName: string;
  currencySymbol: string;
  paymentMethods: string[]; // Supported payment methods
  timezone: string;
}

export interface CurrencyInfo {
  code: string;        // ISO 4217 currency code
  name: string;
  symbol: string;
  country: string;     // Country this currency is primarily used in
  exchangeRateToNGN?: number; // Exchange rate to NGN (Nigerian Naira)
}

export class CurrencyService {
  // Supported countries and their information
  private static readonly SUPPORTED_COUNTRIES: Record<string, CountryInfo> = {
    'NG': {
      code: 'NG',
      name: 'Nigeria',
      currency: 'NGN',
      currencyName: 'Nigerian Naira',
      currencySymbol: '₦',
      paymentMethods: ['card', 'bank_transfer', 'paystack', 'flutterwave', 'ussd'],
      timezone: 'Africa/Lagos'
    },
    'GH': {
      code: 'GH',
      name: 'Ghana',
      currency: 'GHS',
      currencyName: 'Ghanaian Cedi',
      currencySymbol: 'GH₵',
      paymentMethods: ['card', 'bank_transfer', 'mobile_money'],
      timezone: 'Africa/Accra'
    },
    'KE': {
      code: 'KE',
      name: 'Kenya',
      currency: 'KES',
      currencyName: 'Kenyan Shilling',
      currencySymbol: 'KSh',
      paymentMethods: ['card', 'bank_transfer', 'mpesa', 'airtel_money'],
      timezone: 'Africa/Nairobi'
    },
    'UG': {
      code: 'UG',
      name: 'Uganda',
      currency: 'UGX',
      currencyName: 'Ugandan Shilling',
      currencySymbol: 'USh',
      paymentMethods: ['card', 'bank_transfer', 'mobile_money'],
      timezone: 'Africa/Kampala'
    },
    'ZA': {
      code: 'ZA',
      name: 'South Africa',
      currency: 'ZAR',
      currencyName: 'South African Rand',
      currencySymbol: 'R',
      paymentMethods: ['card', 'bank_transfer', 'e_wallet'],
      timezone: 'Africa/Johannesburg'
    },
    'US': {
      code: 'US',
      name: 'United States',
      currency: 'USD',
      currencyName: 'US Dollar',
      currencySymbol: '$',
      paymentMethods: ['card', 'bank_transfer', 'paypal', 'apple_pay', 'google_pay'],
      timezone: 'America/New_York'
    },
    'GB': {
      code: 'GB',
      name: 'United Kingdom',
      currency: 'GBP',
      currencyName: 'British Pound',
      currencySymbol: '£',
      paymentMethods: ['card', 'bank_transfer', 'paypal', 'apple_pay', 'google_pay'],
      timezone: 'Europe/London'
    },
    'EU': {
      code: 'EU',
      name: 'European Union',
      currency: 'EUR',
      currencyName: 'Euro',
      currencySymbol: '€',
      paymentMethods: ['card', 'bank_transfer', 'paypal', 'apple_pay', 'google_pay'],
      timezone: 'Europe/Berlin'
    },
    'CA': {
      code: 'CA',
      name: 'Canada',
      currency: 'CAD',
      currencyName: 'Canadian Dollar',
      currencySymbol: 'CA$',
      paymentMethods: ['card', 'bank_transfer', 'paypal', 'apple_pay', 'google_pay'],
      timezone: 'America/Toronto'
    },
    'AU': {
      code: 'AU',
      name: 'Australia',
      currency: 'AUD',
      currencyName: 'Australian Dollar',
      currencySymbol: 'A$',
      paymentMethods: ['card', 'bank_transfer', 'paypal', 'apple_pay', 'google_pay'],
      timezone: 'Australia/Sydney'
    }
  };

  // Supported currencies
  private static readonly SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
    'NGN': {
      code: 'NGN',
      name: 'Nigerian Naira',
      symbol: '₦',
      country: 'NG',
      exchangeRateToNGN: 1
    },
    'GHS': {
      code: 'GHS',
      name: 'Ghanaian Cedi',
      symbol: 'GH₵',
      country: 'GH'
    },
    'KES': {
      code: 'KES',
      name: 'Kenyan Shilling',
      symbol: 'KSh',
      country: 'KE'
    },
    'UGX': {
      code: 'UGX',
      name: 'Ugandan Shilling',
      symbol: 'USh',
      country: 'UG'
    },
    'ZAR': {
      code: 'ZAR',
      name: 'South African Rand',
      symbol: 'R',
      country: 'ZA'
    },
    'USD': {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      country: 'US'
    },
    'GBP': {
      code: 'GBP',
      name: 'British Pound',
      symbol: '£',
      country: 'GB'
    },
    'EUR': {
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      country: 'EU'
    },
    'CAD': {
      code: 'CAD',
      name: 'Canadian Dollar',
      symbol: 'CA$',
      country: 'CA'
    },
    'AUD': {
      code: 'AUD',
      name: 'Australian Dollar',
      symbol: 'A$',
      country: 'AU'
    }
  };

  // Get all supported countries
  static getSupportedCountries(): CountryInfo[] {
    return Object.values(this.SUPPORTED_COUNTRIES);
  }

  // Get country by code
  static getCountryByCode(countryCode: string): CountryInfo | null {
    return this.SUPPORTED_COUNTRIES[countryCode.toUpperCase()] || null;
  }

  // Get currency info by code
  static getCurrencyByCode(currencyCode: string): CurrencyInfo | null {
    return this.SUPPORTED_CURRENCIES[currencyCode.toUpperCase()] || null;
  }

  // Get supported currencies
  static getSupportedCurrencies(): CurrencyInfo[] {
    return Object.values(this.SUPPORTED_CURRENCIES);
  }

  // Get payment methods for a country
  static getPaymentMethodsForCountry(countryCode: string): string[] {
    const country = this.getCountryByCode(countryCode);
    return country ? country.paymentMethods : ['card', 'bank_transfer']; // Default payment methods
  }

  // Format amount for display based on currency
  static formatAmount(amount: number, currencyCode: string): string {
    const currency = this.getCurrencyByCode(currencyCode);
    
    if (!currency) {
      // Default to NGN if currency not found
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 2
      }).format(amount);
    }
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      // Fallback formatting if Intl fails
      return `${currency.symbol}${amount.toFixed(2)}`;
    }
  }

  // Validate if a currency is supported
  static isCurrencySupported(currencyCode: string): boolean {
    return this.SUPPORTED_CURRENCIES.hasOwnProperty(currencyCode.toUpperCase());
  }

  // Validate if a country is supported
  static isCountrySupported(countryCode: string): boolean {
    return this.SUPPORTED_COUNTRIES.hasOwnProperty(countryCode.toUpperCase());
  }

  // Get locale based on country
  static getLocaleForCountry(countryCode: string): string {
    const country = this.getCountryByCode(countryCode);
    return country ? country.code.toLowerCase() + '-' + country.code : 'en-US';
  }
  
  // Get exchange rate between two currencies (simplified - would use real API in production)
  static getExchangeRate(fromCurrency: string, toCurrency: string): number {
    // This is a simplified exchange rate implementation
    // In a real application, you would fetch real-time rates from an exchange rate API
    if (fromCurrency === toCurrency) {
      return 1;
    }
    
    // For demonstration purposes, use some hardcoded rates relative to NGN
    // In production, these would come from a real exchange rate service
    const ratesToNGN: Record<string, number> = {
      'NGN': 1,
      'GHS': 45,   // 1 GHS ≈ 45 NGN
      'KES': 15,   // 1 KES ≈ 15 NGN  
      'UGX': 0.4,  // 1 UGX ≈ 0.4 NGN
      'ZAR': 8.5,  // 1 ZAR ≈ 8.5 NGN
      'USD': 1500, // 1 USD ≈ 1500 NGN (approximate)
      'GBP': 1900, // 1 GBP ≈ 1900 NGN (approximate)
      'EUR': 1650, // 1 EUR ≈ 1650 NGN (approximate)
      'CAD': 1100, // 1 CAD ≈ 1100 NGN (approximate)
      'AUD': 1000, // 1 AUD ≈ 1000 NGN (approximate)
    };
    
    const fromRate = ratesToNGN[fromCurrency.toUpperCase()];
    const toRate = ratesToNGN[toCurrency.toUpperCase()];
    
    if (fromRate && toRate) {
      return toRate / fromRate;
    }
    
    // If we don't have rates for these currencies, return 1 (no conversion)
    return 1;
  }

  // Convert amount from one currency to another
  static convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) {
      return amount;
    }
    
    const exchangeRate = this.getExchangeRate(fromCurrency, toCurrency);
    return amount * exchangeRate;
  }

  // Get all exchange rates for a specific currency
  static getExchangeRatesForCurrency(baseCurrency: string): Record<string, number> {
    const allCurrencies = this.getSupportedCurrencies();
    const rates: Record<string, number> = {};
    
    allCurrencies.forEach(currency => {
      rates[currency.code] = this.getExchangeRate(baseCurrency, currency.code);
    });
    
    return rates;
  }
  
  // Format currency using the enhanced service
  static formatCurrencyEnhanced(amount: number, currency: string, locale: string = 'en-US'): string {
    return EnhancedCurrencyService.formatCurrency(amount, currency, locale);
  }
}