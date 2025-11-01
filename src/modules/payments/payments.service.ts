import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async processPayment(paymentData: any) {
    try {
      // This is a simplified implementation - in a real app, you'd integrate with a payment provider like Stripe
      const payment = await this.prisma.payment.create({
        data: {
          type: paymentData.type || 'BOOKING',  // Use the correct field from schema
          transactionId: paymentData.transactionId || `txn_${Date.now()}`,  // Required field
          amount: paymentData.amount,
          currency: paymentData.currency || 'NGN',  // Use NGN as default based on schema
          paymentMethod: paymentData.paymentMethod,
          status: paymentData.status || 'PENDING',  // Use the status field from schema
          // Add other required fields based on schema...
        },
      });

      this.logger.info('Payment created successfully', { paymentId: payment.id });

      // In a real implementation, you would process the payment with a payment provider
      // and update the status based on the result
      
      return payment;
    } catch (error) {
      this.logger.error('Error processing payment', { error: error.message, paymentData });
      throw error;
    }
  }

  async getPaymentById(paymentId: string) {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
      });

      return payment;
    } catch (error) {
      this.logger.error('Error finding payment by ID', { paymentId, error: error.message });
      throw error;
    }
  }

  async getUserPayments(userId: string, page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;
      const payments = await this.prisma.payment.findMany({
        where: {
          // Need to use relations rather than userId directly based on schema
          // The schema doesn't have a direct userId field on Payment
          // It connects via relations like booking, subscription, etc.
        },
        skip,
        take: limit,
        orderBy: {
          timestamp: 'desc',  // Use timestamp instead of createdAt
        },
      });

      const total = await this.prisma.payment.count({
        where: {
          // Need to use relations rather than userId directly based on schema
        },
      });
      
      return {
        data: payments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Error finding user payments', { userId, error: error.message });
      throw error;
    }
  }
}