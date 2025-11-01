import prisma from './prisma';
import { VendorInsightPackage } from '@prisma/client';

interface CreateVendorInsightPackageInput {
  vendorId: string;
  type: string; // 'BASIC', 'PREMIUM', 'CUSTOM_REPORT'
  amount: number;
  paymentStatus?: string;
  details?: any;
  expiresAt?: Date;
}

interface UpdateVendorInsightPackageInput {
  status?: string;
  paymentStatus?: string;
  details?: any;
  expiresAt?: Date;
}

export class VendorInsightPackageService {
  // Get all insight packages for a vendor
  static async getVendorInsightPackages(vendorId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [packages, total] = await Promise.all([
      prisma.vendorInsightPackage.findMany({
        where: { vendorId },
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
              category: true,
            }
          }
        },
        skip,
        take: limit,
        orderBy: { purchasedAt: 'desc' },
      }),
      prisma.vendorInsightPackage.count({ where: { vendorId } })
    ]);

    return {
      packages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  // Get insight package by ID
  static async getVendorInsightPackageById(id: string, vendorId: string) {
    return await prisma.vendorInsightPackage.findFirst({
      where: { id, vendorId }
    });
  }

  // Create a new vendor insight package
  static async createVendorInsightPackage(packageData: CreateVendorInsightPackageInput, vendorId: string) {
    // Verify the vendor exists and get their currency preference
    const vendor = await prisma.vendor.findUnique({
      where: { userId: vendorId },
      include: {
        user: {
          select: { currency: true }
        }
      }
    });

    if (!vendor || !vendor.user) {
      throw new Error('Vendor not found');
    }

    // Check if vendor already has an active premium/custom report
    if (packageData.type === 'PREMIUM') {
      const existingPremium = await prisma.vendorInsightPackage.findFirst({
        where: {
          vendorId,
          type: 'PREMIUM',
          status: { in: ['PENDING', 'ACTIVE'] },
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } }
          ]
        }
      });

      if (existingPremium) {
        throw new Error('Vendor already has an active premium insights package');
      }
    } else if (packageData.type === 'CUSTOM_REPORT') {
      // For custom reports, multiple can exist as they are different reports
    }

    return await prisma.vendorInsightPackage.create({
      data: {
        vendorId: packageData.vendorId,
        type: packageData.type,
        amount: packageData.amount,
        currency: vendor.user.currency || 'NGN', // Use vendor's currency or default to NGN
        status: 'PENDING',
        paymentStatus: packageData.paymentStatus || 'PENDING',
        details: packageData.details,
        purchasedAt: new Date(),
        expiresAt: packageData.expiresAt,
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

  // Update a vendor insight package
  static async updateVendorInsightPackage(id: string, vendorId: string, updateData: UpdateVendorInsightPackageInput) {
    const pkg = await prisma.vendorInsightPackage.findFirst({
      where: { id, vendorId }
    });

    if (!pkg) {
      throw new Error('Insight package not found or you do not have permission to update it');
    }

    return await prisma.vendorInsightPackage.update({
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

  // Cancel a vendor insight package
  static async cancelVendorInsightPackage(id: string, vendorId: string) {
    const pkg = await prisma.vendorInsightPackage.findFirst({
      where: { id, vendorId }
    });

    if (!pkg) {
      throw new Error('Insight package not found or you do not have permission to cancel it');
    }

    return await prisma.vendorInsightPackage.update({
      where: { id },
      data: { 
        status: 'CANCELLED',
        expiresAt: new Date() // Set expiration to now
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

  // Check if vendor has active insight package of a specific type
  static async vendorHasActiveInsightPackage(vendorId: string, type?: string): Promise<boolean> {
    const whereClause: any = {
      vendorId,
      status: { in: ['PENDING', 'ACTIVE'] },
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } }
      ]
    };

    if (type) {
      whereClause.type = type;
    }

    const pkg = await prisma.vendorInsightPackage.findFirst({
      where: whereClause
    });

    return pkg !== null;
  }

  // Get basic insights for vendor (non-paid insights)
  static async getBasicVendorInsights(vendorId: string) {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: vendorId },
      select: {
        id: true,
        totalReviews: true,
        ratingAverage: true,
        createdAt: true,
      }
    });

    if (!vendor) {
      throw new Error('Vendor not found');
    }

    // Get booking statistics
    const bookingStats = await prisma.booking.aggregate({
      where: {
        vendorId: vendor.id,
      },
      _count: {
        _all: true,
      },
      _sum: {
        amount: true,
      }
    });

    // Get review statistics
    const reviewStats = await prisma.review.aggregate({
      where: {
        vendorId: vendor.id,
      },
      _avg: {
        rating: true,
      },
      _count: {
        _all: true,
      }
    });

    return {
      vendorInfo: vendor,
      bookingStats,
      reviewStats,
      basicInsightsAvailable: true
    };
  }
}