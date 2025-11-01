import prisma from './prisma';
import { Payment, PaymentStatus, Booking } from '@prisma/client';

interface CreatePaymentInput {
  bookingId: string;
  transactionId: string;
  amount: number;
  paymentMethod: string;
  currency?: string; // Optional currency override
}

interface UpdatePaymentInput {
  status?: PaymentStatus;
  transactionId?: string;
  amount?: number;
  paymentMethod?: string;
  currency?: string;
}

export class PaymentService {
  // Get payment by booking ID
  static async getPaymentByBookingId(bookingId: string, userId: string) {
    const payment = await prisma.payment.findUnique({
      where: { bookingId },
      include: {
        booking: {
          include: {
            event: {
              select: {
                userId: true
              }
            },
            vendor: {
              select: {
                userId: true
              }
            }
          }
        }
      }
    });
    
    if (!payment) {
      return null;
    }
    
    // Check if the user has permission to access this payment
    // Either they are the event planner or the vendor for this booking
    const isEventOwner = payment.booking.event.userId === userId;
    const isVendor = payment.booking.vendor.userId === userId;
    
    if (!isEventOwner && !isVendor) {
      return null;
    }
    
    return payment;
  }

  // Get payment by ID
  static async getPaymentById(id: string, userId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            event: {
              select: {
                userId: true
              }
            },
            vendor: {
              select: {
                userId: true
              }
            }
          }
        }
      }
    });
    
    if (!payment) {
      return null;
    }
    
    // Check if the user has permission to access this payment
    const isEventOwner = payment.booking.event.userId === userId;
    const isVendor = payment.booking.vendor.userId === userId;
    
    if (!isEventOwner && !isVendor) {
      return null;
    }
    
    return payment;
  }

  // Create a new payment
  static async createPayment(paymentData: CreatePaymentInput, userId: string) {
    // Check if booking exists and if user has permission
    const booking = await prisma.booking.findUnique({
      where: { id: paymentData.bookingId },
      include: {
        event: {
          select: {
            userId: true
          }
        }
      }
    });
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    // Get user's currency preference
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currency: true }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Only the event owner can initiate payment
    if (booking.event.userId !== userId) {
      throw new Error('You do not have permission to initiate payment for this booking');
    }
    
    // Check if a payment already exists for this booking
    const existingPayment = await prisma.payment.findUnique({
      where: { bookingId: paymentData.bookingId }
    });
    
    if (existingPayment) {
      throw new Error('Payment already exists for this booking');
    }
    
    // Create the payment with user's currency or override
    const paymentCurrency = paymentData.currency || user.currency || booking.currency || 'NGN';
    
    const payment = await prisma.payment.create({
      data: {
        bookingId: paymentData.bookingId,
        type: 'BOOKING', // Default type for booking payment
        transactionId: paymentData.transactionId,
        amount: paymentData.amount,
        currency: paymentCurrency, // Use provided currency, user currency, booking currency, or default
        paymentMethod: paymentData.paymentMethod,
        status: 'PENDING', // Default status
        originalAmount: paymentData.amount, // Store original amount in user's currency
      },
      include: {
        booking: {
          include: {
            event: {
              select: {
                name: true,
                date: true
              }
            },
            vendor: {
              select: {
                businessName: true
              }
            }
          }
        }
      }
    });
    
    // Update the booking payment status
    await prisma.booking.update({
      where: { id: paymentData.bookingId },
      data: {
        paymentStatus: 'PENDING'
      }
    });
    
    return payment;
  }

  // Update payment
  static async updatePayment(id: string, userId: string, updateData: UpdatePaymentInput) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            event: {
              select: {
                userId: true
              }
            }
          }
        }
      }
    });
    
    if (!payment) {
      throw new Error('Payment not found');
    }
    
    // Only the event owner can update payment details
    if (payment.booking.event.userId !== userId) {
      throw new Error('You do not have permission to update this payment');
    }
    
    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        booking: {
          include: {
            event: {
              select: {
                name: true
              }
            },
            vendor: {
              select: {
                businessName: true
              }
            }
          }
        }
      }
    });
    
    // Update the associated booking's payment status if payment status changed
    if (updateData.status) {
      await prisma.booking.update({
        where: { payment: { id } },
        data: { paymentStatus: updateData.status }
      });
    }
    
    return updatedPayment;
  }

  // Process payment completion (from payment processor webhook)
  static async processPaymentCompletion(bookingId: string, status: PaymentStatus) {
    // Update payment status
    const payment = await prisma.payment.update({
      where: { bookingId },
      data: { 
        status,
        timestamp: new Date()
      },
      include: {
        booking: {
          select: {
            id: true,
            eventId: true,
            vendorId: true
          }
        }
      }
    });
    
    // Update the booking status based on payment status
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { 
        paymentStatus: status,
        status: status === 'PAID' ? 'CONFIRMED' : 'PENDING' // Update booking status to confirmed if payment is successful
      }
    });
    
    return payment;
  }

  // Create a payment intent (pre-authorize payment with payment processor)
  static async createPaymentIntent(bookingId: string, userId: string, options?: { 
    returnUrl?: string; 
    cancelUrl?: string; 
    paymentMethod?: string;
  }) {
    // Verify booking exists and belongs to user
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        event: {
          select: {
            userId: true
          }
        }
      }
    });
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    if (booking.event.userId !== userId) {
      throw new Error('You do not have permission to create a payment intent for this booking');
    }

    // In a real implementation, this would communicate with a payment processor
    // like Stripe, PayPal, Paystack, etc. to create an actual payment intent.
    // For this mock implementation, we'll return the information needed
    // to complete the payment later.
    
    return {
      paymentIntentId: `pi_${bookingId}_${Date.now()}`, // Mock payment intent ID
      bookingId: booking.id,
      amount: booking.customerTotal || booking.amount,
      currency: booking.currency,
      status: 'requires_payment_method', // Standard payment intent status
      createdAt: new Date(),
      returnUrl: options?.returnUrl,
      cancelUrl: options?.cancelUrl,
      paymentMethod: options?.paymentMethod,
      // In real implementation, this would contain payment processor specific data
      processorData: {
        clientSecret: `secret_${bookingId}_${Date.now()}`,
        paymentMethodTypes: ['card', 'bank_transfer']
      }
    };
  }

  // Get all payments for a user
  static async getUserPayments(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: {
          booking: {
            event: {
              userId: userId
            }
          }
        },
        include: {
          booking: {
            include: {
              event: {
                select: {
                  name: true,
                  date: true
                }
              },
              vendor: {
                select: {
                  businessName: true
                }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({
        where: {
          booking: {
            event: {
              userId: userId
            }
          }
        }
      })
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }
}