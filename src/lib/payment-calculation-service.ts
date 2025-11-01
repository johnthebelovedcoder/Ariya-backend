import { Booking } from '@prisma/client';
import { CurrencyService } from './currency-service';

interface BookingPaymentDetails {
  originalAmount: number;        // The base amount of the booking
  originalCurrency: string;      // The currency of the original amount
  customerTotal: number;         // What the customer pays (original + service fee)
  customerCurrency: string;      // The currency of the customer total
  vendorNet: number;             // What the vendor receives (original - vendor commission)
  vendorCurrency: string;        // The currency of the vendor net amount
  ariyaRevenue: number;          // Ariya's revenue from the transaction (service fee + vendor commission)
  ariyaCurrency: string;         // The currency of Ariya's revenue
  customerServiceFee: number;    // The 3% fee charged to customer
  vendorCommission: number;      // The 7% commission taken from vendor
}

export class PaymentCalculationService {
  // Calculate all payment details based on the Ariya pricing model
  static calculateBookingPaymentDetails(amount: number, currency: string = 'NGN'): BookingPaymentDetails {
    // According to the pricing model:
    // - Customer pays 3% service fee on top of the booking amount
    // - Vendor pays 7% commission on the booking amount
    const customerServiceFeePercent = 0.03;  // 3% customer service fee
    const vendorCommissionPercent = 0.07;    // 7% vendor commission
    
    const customerServiceFee = amount * customerServiceFeePercent;
    const vendorCommission = amount * vendorCommissionPercent;
    
    const customerTotal = amount + customerServiceFee;
    const vendorNet = amount - vendorCommission;
    const ariyaRevenue = customerServiceFee + vendorCommission;
    
    return {
      originalAmount: amount,
      originalCurrency: currency,
      customerTotal,
      customerCurrency: currency,
      vendorNet,
      vendorCurrency: currency,
      ariyaRevenue,
      ariyaCurrency: currency,
      customerServiceFee,
      vendorCommission
    };
  }

  // Calculate payment details for subscription
  static calculateSubscriptionPaymentDetails(amount: number, type: 'user' | 'vendor', currency: string = 'NGN'): BookingPaymentDetails {
    // For subscriptions, typically only a service fee is charged (no vendor commission since it's a user/vendor paying for platform features)
    // Let's assume 3% service fee for user subscriptions and 3% for vendor subscriptions
    const serviceFeePercent = 0.03;
    const serviceFee = amount * serviceFeePercent;
    
    return {
      originalAmount: amount,
      originalCurrency: currency,
      customerTotal: amount + serviceFee,
      customerCurrency: currency,
      vendorNet: type === 'vendor' ? amount - (amount * 0.07) : amount, // If vendor subscription, they get less
      vendorCurrency: currency,
      ariyaRevenue: serviceFee,
      ariyaCurrency: currency,
      customerServiceFee: serviceFee,
      vendorCommission: type === 'vendor' ? amount * 0.07 : 0
    };
  }

  // Calculate payment details for featured listing
  static calculateFeaturedListingPaymentDetails(amount: number, currency: string = 'NGN'): BookingPaymentDetails {
    // For featured listings, assume 3% service fee
    const serviceFeePercent = 0.03;
    const serviceFee = amount * serviceFeePercent;
    
    return {
      originalAmount: amount,
      originalCurrency: currency,
      customerTotal: amount + serviceFee,
      customerCurrency: currency,
      vendorNet: amount, // Vendor pays the full amount for listing
      vendorCurrency: currency,
      ariyaRevenue: serviceFee,
      ariyaCurrency: currency,
      customerServiceFee: serviceFee,
      vendorCommission: 0
    };
  }

  // Calculate payment details for event website upgrades
  static calculateEventWebsiteUpgradePaymentDetails(amount: number, currency: string = 'NGN'): BookingPaymentDetails {
    // For event website upgrades, assume 3% service fee
    const serviceFeePercent = 0.03;
    const serviceFee = amount * serviceFeePercent;
    
    return {
      originalAmount: amount,
      originalCurrency: currency,
      customerTotal: amount + serviceFee,
      customerCurrency: currency,
      vendorNet: amount, // User pays for these upgrades
      vendorCurrency: currency,
      ariyaRevenue: serviceFee,
      ariyaCurrency: currency,
      customerServiceFee: serviceFee,
      vendorCommission: 0
    };
  }

  // Calculate payment details for vendor insight packages
  static calculateVendorInsightPackagePaymentDetails(amount: number, currency: string = 'NGN'): BookingPaymentDetails {
    // For vendor insight packages, assume 3% service fee
    const serviceFeePercent = 0.03;
    const serviceFee = amount * serviceFeePercent;
    
    return {
      originalAmount: amount,
      originalCurrency: currency,
      customerTotal: amount + serviceFee,
      customerCurrency: currency,
      vendorNet: amount, // Vendor pays for these insights
      vendorCurrency: currency,
      ariyaRevenue: serviceFee,
      ariyaCurrency: currency,
      customerServiceFee: serviceFee,
      vendorCommission: 0
    };
  }

  // Calculate payment details for registry purchases
  static calculateRegistryPaymentDetails(amount: number, currency: string = 'NGN'): BookingPaymentDetails {
    // For registry purchases, assume 3-5% transaction fee
    const transactionFeePercent = 0.04; // Taking 4% as average between 3-5%
    const transactionFee = amount * transactionFeePercent;
    
    return {
      originalAmount: amount,
      originalCurrency: currency,
      customerTotal: amount + transactionFee,
      customerCurrency: currency,
      vendorNet: amount, // Guest pays for registry items
      vendorCurrency: currency,
      ariyaRevenue: transactionFee,
      ariyaCurrency: currency,
      customerServiceFee: transactionFee,
      vendorCommission: 0
    };
  }

  // Calculate cash gift conversion fee
  static calculateCashGiftConversionDetails(amount: number, currency: string = 'NGN'): BookingPaymentDetails {
    // For cash gift conversion, assume 4% processing fee (as per pricing model)
    const processingFeePercent = 0.04;
    const processingFee = amount * processingFeePercent;
    
    return {
      originalAmount: amount,
      originalCurrency: currency,
      customerTotal: amount + processingFee,
      customerCurrency: currency,
      vendorNet: amount, // Recipient gets less after conversion fee
      vendorCurrency: currency,
      ariyaRevenue: processingFee,
      ariyaCurrency: currency,
      customerServiceFee: processingFee,
      vendorCommission: 0
    };
  }

  // Format currency for display based on currency code
  static formatCurrency(amount: number, currencyCode: string = 'NGN'): string {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      // Fallback formatting if Intl fails
      const currencyInfo = CurrencyService.getCurrencyByCode(currencyCode);
      if (currencyInfo) {
        return `${currencyInfo.symbol}${amount.toFixed(2)}`;
      }
      // Default to NGN if currency not found
      return `₦${amount.toFixed(2)}`;
    }
  }

  // Convert amount from one currency to another
  static convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
    return CurrencyService.convertCurrency(amount, fromCurrency, toCurrency);
  }
}