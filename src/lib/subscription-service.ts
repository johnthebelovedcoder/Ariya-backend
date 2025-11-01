import prisma from './prisma';
import { 
  Subscription, 
  SubscriptionPlan, 
  SubscriptionInterval, 
  SubscriptionStatus, 
  VendorSubscription 
} from '@prisma/client';

interface CreateSubscriptionInput {
  userId: string;
  plan: SubscriptionPlan;
  interval: SubscriptionInterval;
  amount: number;
  startDate: Date;
  endDate: Date;
  isAutoRenew?: boolean;
  paymentMethodId?: string;
}

interface CreateVendorSubscriptionInput {
  vendorId: string;
  plan: SubscriptionPlan;
  interval: SubscriptionInterval;
  amount: number;
  startDate: Date;
  endDate: Date;
  isAutoRenew?: boolean;
  paymentMethodId?: string;
}

interface UpdateSubscriptionInput {
  plan?: SubscriptionPlan;
  interval?: SubscriptionInterval;
  amount?: number;
  endDate?: Date;
  isAutoRenew?: boolean;
  status?: SubscriptionStatus;
}

export class SubscriptionService {
  // Get user subscription by user ID
  static async getUserSubscription(userId: string) {
    return await prisma.subscription.findFirst({
      where: { userId, status: { in: ['ACTIVE', 'INACTIVE', 'EXPIRED'] } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
  }

  // Create a new user subscription
  static async createSubscription(subscriptionData: CreateSubscriptionInput) {
    // Get user's currency preference
    const user = await prisma.user.findUnique({
      where: { id: subscriptionData.userId },
      select: { currency: true }
    });
    
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user already has an active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: { 
        userId: subscriptionData.userId,
        status: { in: ['ACTIVE', 'INACTIVE'] } // Check for active or inactive (not cancelled/expired)
      }
    });

    if (existingSubscription) {
      throw new Error('User already has an active or inactive subscription');
    }

    return await prisma.subscription.create({
      data: {
        userId: subscriptionData.userId,
        plan: subscriptionData.plan,
        interval: subscriptionData.interval,
        amount: subscriptionData.amount,
        currency: user.currency || 'NGN', // Use user's currency or default to NGN
        startDate: subscriptionData.startDate,
        endDate: subscriptionData.endDate,
        isAutoRenew: subscriptionData.isAutoRenew ?? true,
        paymentMethodId: subscriptionData.paymentMethodId,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            currency: true,
          }
        }
      }
    });
  }

  // Update a user subscription
  static async updateSubscription(id: string, userId: string, updateData: UpdateSubscriptionInput) {
    const subscription = await prisma.subscription.findFirst({
      where: { id, userId }
    });

    if (!subscription) {
      throw new Error('Subscription not found or you do not have permission to update it');
    }

    return await prisma.subscription.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
  }

  // Cancel a user subscription
  static async cancelSubscription(id: string, userId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: { id, userId }
    });

    if (!subscription) {
      throw new Error('Subscription not found or you do not have permission to cancel it');
    }

    return await prisma.subscription.update({
      where: { id },
      data: { 
        status: 'CANCELLED',
        isAutoRenew: false
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
  }

  // Get vendor subscription by vendor ID
  static async getVendorSubscription(vendorId: string) {
    return await prisma.vendorSubscription.findFirst({
      where: { vendorId, status: { in: ['ACTIVE', 'INACTIVE', 'EXPIRED'] } },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            category: true,
          }
        }
      }
    });
  }

  // Create a new vendor subscription
  static async createVendorSubscription(subscriptionData: CreateVendorSubscriptionInput) {
    // Get vendor user's currency preference through the vendor's userId
    const vendor = await prisma.vendor.findUnique({
      where: { id: subscriptionData.vendorId },
      include: {
        user: {
          select: { currency: true }
        }
      }
    });

    if (!vendor || !vendor.user) {
      throw new Error('Vendor or associated user not found');
    }

    // Check if vendor already has an active subscription
    const existingSubscription = await prisma.vendorSubscription.findFirst({
      where: { 
        vendorId: subscriptionData.vendorId,
        status: { in: ['ACTIVE', 'INACTIVE'] } // Check for active or inactive (not cancelled/expired)
      }
    });

    if (existingSubscription) {
      throw new Error('Vendor already has an active or inactive subscription');
    }

    return await prisma.vendorSubscription.create({
      data: {
        vendorId: subscriptionData.vendorId,
        plan: subscriptionData.plan,
        interval: subscriptionData.interval,
        amount: subscriptionData.amount,
        currency: vendor.user.currency || 'NGN', // Use vendor's currency or default to NGN
        startDate: subscriptionData.startDate,
        endDate: subscriptionData.endDate,
        isAutoRenew: subscriptionData.isAutoRenew ?? true,
        paymentMethodId: subscriptionData.paymentMethodId,
        status: 'ACTIVE',
      },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            category: true,
          }
        }
      }
    });
  }

  // Update a vendor subscription
  static async updateVendorSubscription(id: string, vendorId: string, updateData: UpdateSubscriptionInput) {
    const subscription = await prisma.vendorSubscription.findFirst({
      where: { id, vendorId }
    });

    if (!subscription) {
      throw new Error('Vendor subscription not found or you do not have permission to update it');
    }

    return await prisma.vendorSubscription.update({
      where: { id },
      data: updateData,
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            category: true,
          }
        }
      }
    });
  }

  // Cancel a vendor subscription
  static async cancelVendorSubscription(id: string, vendorId: string) {
    const subscription = await prisma.vendorSubscription.findFirst({
      where: { id, vendorId }
    });

    if (!subscription) {
      throw new Error('Vendor subscription not found or you do not have permission to cancel it');
    }

    return await prisma.vendorSubscription.update({
      where: { id },
      data: { 
        status: 'CANCELLED',
        isAutoRenew: false
      },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            category: true,
          }
        }
      }
    });
  }

  // Check if user has active Pro subscription
  static async userHasProSubscription(userId: string): Promise<boolean> {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        plan: 'PRO',
        status: 'ACTIVE',
        endDate: { gte: new Date() }
      }
    });

    return subscription !== null;
  }

  // Check if vendor has premium subscription
  static async vendorHasPremiumSubscription(vendorId: string): Promise<boolean> {
    const subscription = await prisma.vendorSubscription.findFirst({
      where: {
        vendorId,
        plan: { in: ['PRO', 'PREMIUM'] },
        status: 'ACTIVE',
        endDate: { gte: new Date() }
      }
    });

    return subscription !== null;
  }
}