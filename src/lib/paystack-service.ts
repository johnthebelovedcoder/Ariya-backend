import axios, { AxiosInstance } from 'axios';
import { PAYSTACK_SECRET_KEY } from '@/constants/config';
import Logger from './logger-service';

interface PaystackInitializePaymentResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyPaymentResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: 'success' | 'failed' | 'abandoned';
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: any;
    fees: number;
    customer: {
      id: number;
      email: string;
      customer_code: string;
    };
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
    };
  };
}

interface InitializePaymentParams {
  email: string;
  amount: number; // in kobo (smallest currency unit)
  reference: string;
  currency?: string;
  callback_url?: string;
  metadata?: Record<string, any>;
  channels?: string[];
  subaccount?: string;
  transaction_charge?: number;
  bearer?: 'account' | 'subaccount';
}

/**
 * Paystack Payment Service
 * Handles all Paystack payment operations
 */
export class PaystackService {
  private static client: AxiosInstance;

  private static getClient(): AxiosInstance {
    if (!this.client) {
      this.client = axios.create({
        baseURL: 'https://api.paystack.co',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
    }
    return this.client;
  }

  /**
   * Initialize a payment transaction
   */
  static async initializePayment(
    params: InitializePaymentParams
  ): Promise<PaystackInitializePaymentResponse> {
    try {
      Logger.info('Initializing Paystack payment', {
        reference: params.reference,
        amount: params.amount,
        email: params.email,
      });

      const response = await this.getClient().post<PaystackInitializePaymentResponse>(
        '/transaction/initialize',
        params
      );

      Logger.info('Paystack payment initialized', {
        reference: params.reference,
        authorization_url: response.data.data.authorization_url,
      });

      return response.data;
    } catch (error: any) {
      Logger.error('Failed to initialize Paystack payment', {
        reference: params.reference,
        error: error.response?.data || error.message,
      });
      throw new Error(
        error.response?.data?.message || 'Failed to initialize payment'
      );
    }
  }

  /**
   * Verify a payment transaction
   */
  static async verifyPayment(
    reference: string
  ): Promise<PaystackVerifyPaymentResponse> {
    try {
      Logger.info('Verifying Paystack payment', { reference });

      const response = await this.getClient().get<PaystackVerifyPaymentResponse>(
        `/transaction/verify/${reference}`
      );

      Logger.info('Paystack payment verified', {
        reference,
        status: response.data.data.status,
        amount: response.data.data.amount,
      });

      return response.data;
    } catch (error: any) {
      Logger.error('Failed to verify Paystack payment', {
        reference,
        error: error.response?.data || error.message,
      });
      throw new Error(
        error.response?.data?.message || 'Failed to verify payment'
      );
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(payload)
      .digest('hex');
    
    return hash === signature;
  }

  /**
   * Create a refund
   */
  static async createRefund(
    transaction: string | number,
    amount?: number,
    currency?: string,
    customer_note?: string,
    merchant_note?: string
  ): Promise<any> {
    try {
      Logger.info('Creating Paystack refund', { transaction, amount });

      const payload: any = { transaction };
      if (amount) payload.amount = amount;
      if (currency) payload.currency = currency;
      if (customer_note) payload.customer_note = customer_note;
      if (merchant_note) payload.merchant_note = merchant_note;

      const response = await this.getClient().post('/refund', payload);

      Logger.info('Paystack refund created', {
        transaction,
        refund_id: response.data.data.id,
      });

      return response.data;
    } catch (error: any) {
      Logger.error('Failed to create Paystack refund', {
        transaction,
        error: error.response?.data || error.message,
      });
      throw new Error(
        error.response?.data?.message || 'Failed to create refund'
      );
    }
  }

  /**
   * List transactions
   */
  static async listTransactions(params?: {
    perPage?: number;
    page?: number;
    customer?: string;
    status?: 'success' | 'failed' | 'abandoned';
    from?: string;
    to?: string;
    amount?: number;
  }): Promise<any> {
    try {
      const response = await this.getClient().get('/transaction', { params });
      return response.data;
    } catch (error: any) {
      Logger.error('Failed to list Paystack transactions', {
        error: error.response?.data || error.message,
      });
      throw new Error(
        error.response?.data?.message || 'Failed to list transactions'
      );
    }
  }

  /**
   * Fetch transaction
   */
  static async fetchTransaction(id: number | string): Promise<any> {
    try {
      const response = await this.getClient().get(`/transaction/${id}`);
      return response.data;
    } catch (error: any) {
      Logger.error('Failed to fetch Paystack transaction', {
        id,
        error: error.response?.data || error.message,
      });
      throw new Error(
        error.response?.data?.message || 'Failed to fetch transaction'
      );
    }
  }

  /**
   * Create a transfer recipient (for payouts to vendors)
   */
  static async createTransferRecipient(params: {
    type: 'nuban' | 'mobile_money' | 'basa';
    name: string;
    account_number: string;
    bank_code: string;
    currency?: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<any> {
    try {
      Logger.info('Creating Paystack transfer recipient', {
        name: params.name,
        account_number: params.account_number,
      });

      const response = await this.getClient().post('/transferrecipient', params);

      Logger.info('Paystack transfer recipient created', {
        recipient_code: response.data.data.recipient_code,
      });

      return response.data;
    } catch (error: any) {
      Logger.error('Failed to create Paystack transfer recipient', {
        error: error.response?.data || error.message,
      });
      throw new Error(
        error.response?.data?.message || 'Failed to create transfer recipient'
      );
    }
  }

  /**
   * Initiate a transfer (payout to vendor)
   */
  static async initiateTransfer(params: {
    source: string;
    amount: number;
    recipient: string;
    reason?: string;
    currency?: string;
    reference?: string;
  }): Promise<any> {
    try {
      Logger.info('Initiating Paystack transfer', {
        recipient: params.recipient,
        amount: params.amount,
        reference: params.reference,
      });

      const response = await this.getClient().post('/transfer', params);

      Logger.info('Paystack transfer initiated', {
        transfer_code: response.data.data.transfer_code,
        status: response.data.data.status,
      });

      return response.data;
    } catch (error: any) {
      Logger.error('Failed to initiate Paystack transfer', {
        error: error.response?.data || error.message,
      });
      throw new Error(
        error.response?.data?.message || 'Failed to initiate transfer'
      );
    }
  }

  /**
   * List banks
   */
  static async listBanks(country: string = 'nigeria', params?: {
    perPage?: number;
    page?: number;
    pay_with_bank?: boolean;
  }): Promise<any> {
    try {
      const response = await this.getClient().get('/bank', {
        params: { country, ...params },
      });
      return response.data;
    } catch (error: any) {
      Logger.error('Failed to list Paystack banks', {
        error: error.response?.data || error.message,
      });
      throw new Error(
        error.response?.data?.message || 'Failed to list banks'
      );
    }
  }

  /**
   * Resolve account number
   */
  static async resolveAccountNumber(
    account_number: string,
    bank_code: string
  ): Promise<any> {
    try {
      const response = await this.getClient().get('/bank/resolve', {
        params: { account_number, bank_code },
      });
      return response.data;
    } catch (error: any) {
      Logger.error('Failed to resolve account number', {
        account_number,
        bank_code,
        error: error.response?.data || error.message,
      });
      throw new Error(
        error.response?.data?.message || 'Failed to resolve account number'
      );
    }
  }

  /**
   * Generate payment reference
   */
  static generateReference(prefix: string = 'ARY'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Convert amount to kobo (smallest currency unit)
   */
  static toKobo(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Convert amount from kobo to naira
   */
  static fromKobo(amount: number): number {
    return amount / 100;
  }
}
