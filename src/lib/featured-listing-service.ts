import prisma from './prisma';
import { FeaturedListing } from '@prisma/client';

interface CreateFeaturedListingInput {
  vendorId: string;
  type: string; // 'CATEGORY_TOP_SPOT', 'SEARCH_RESULT_BOOST'
  amount: number;
  startDate: Date;
  endDate: Date;
  paymentStatus?: string;
}

interface UpdateFeaturedListingInput {
  status?: string;
  paymentStatus?: string;
}

export class FeaturedListingService {
  // Get active featured listings for a vendor
  static async getVendorFeaturedListings(vendorId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [listings, total] = await Promise.all([
      prisma.featuredListing.findMany({
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
        orderBy: { createdAt: 'desc' },
      }),
      prisma.featuredListing.count({ where: { vendorId } })
    ]);

    return {
      listings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  // Get featured listing by ID
  static async getFeaturedListingById(id: string, vendorId: string) {
    return await prisma.featuredListing.findFirst({
      where: { id, vendorId }
    });
  }

  // Create a new featured listing
  static async createFeaturedListing(featuredListingData: CreateFeaturedListingInput, vendorId: string) {
    // Check if vendor exists and get their currency preference
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

    // Only allow one active listing of each type at a time
    if (featuredListingData.type === 'CATEGORY_TOP_SPOT') {
      const existingTopSpot = await prisma.featuredListing.findFirst({
        where: {
          vendorId,
          type: 'CATEGORY_TOP_SPOT',
          status: 'ACTIVE',
          endDate: { gte: new Date() }
        }
      });

      if (existingTopSpot) {
        throw new Error('Vendor already has an active CATEGORY_TOP_SPOT listing');
      }
    }

    return await prisma.featuredListing.create({
      data: {
        vendorId: featuredListingData.vendorId,
        type: featuredListingData.type,
        amount: featuredListingData.amount,
        currency: vendor.user.currency || 'NGN', // Use vendor's currency or default
        startDate: featuredListingData.startDate,
        endDate: featuredListingData.endDate,
        status: 'ACTIVE',
        paymentStatus: featuredListingData.paymentStatus || 'PENDING',
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

  // Update a featured listing
  static async updateFeaturedListing(id: string, vendorId: string, updateData: UpdateFeaturedListingInput) {
    const listing = await prisma.featuredListing.findFirst({
      where: { id, vendorId }
    });

    if (!listing) {
      throw new Error('Featured listing not found or you do not have permission to update it');
    }

    return await prisma.featuredListing.update({
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

  // Cancel a featured listing (update status to INACTIVE)
  static async cancelFeaturedListing(id: string, vendorId: string) {
    const listing = await prisma.featuredListing.findFirst({
      where: { id, vendorId }
    });

    if (!listing) {
      throw new Error('Featured listing not found or you do not have permission to cancel it');
    }

    return await prisma.featuredListing.update({
      where: { id },
      data: { 
        status: 'INACTIVE'
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

  // Check if vendor has active featured listing of a specific type
  static async vendorHasActiveFeaturedListing(vendorId: string, type?: string): Promise<boolean> {
    const whereClause: any = {
      vendorId,
      status: 'ACTIVE',
      endDate: { gte: new Date() }
    };

    if (type) {
      whereClause.type = type;
    }

    const listing = await prisma.featuredListing.findFirst({
      where: whereClause
    });

    return listing !== null;
  }

  // Get all active featured listings by type for vendors in a specific category
  static async getActiveFeaturedListingsByCategory(category: string, type: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [listings, total] = await Promise.all([
      prisma.featuredListing.findMany({
        where: {
          status: 'ACTIVE',
          type,
          endDate: { gte: new Date() },
          vendor: {
            category: { contains: category, mode: 'insensitive' }
          }
        },
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
              category: true,
              ratingAverage: true,
              totalReviews: true,
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.featuredListing.count({
        where: {
          status: 'ACTIVE',
          type,
          endDate: { gte: new Date() },
          vendor: {
            category: { contains: category, mode: 'insensitive' }
          }
        }
      })
    ]);

    return {
      listings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }
}