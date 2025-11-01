import prisma from './prisma';
import { Vendor, User, Booking, Review, SubscriptionTier } from '@prisma/client';

interface CreateVendorInput {
  userId: string;
  businessName: string;
  description: string;
  category: string;
  pricing: number;
  location: string;
  portfolio?: string[];
  availability?: any;
}

interface UpdateVendorInput {
  businessName?: string;
  description?: string;
  category?: string;
  pricing?: number;
  location?: string;
  portfolio?: string[];
  availability?: any;
  subscriptionTier?: SubscriptionTier;
  isVerified?: boolean;
}

export class VendorService {
  // Get all vendors with optional filtering
  static async getAllVendors(
    page: number = 1,
    limit: number = 10,
    category?: string,
    location?: string,
    minRating?: number
  ) {
    const skip = (page - 1) * limit;
    
    const whereClause: any = { isVerified: true }; // Only show verified vendors by default
    
    if (category) {
      whereClause.category = { contains: category, mode: 'insensitive' };
    }
    
    if (location) {
      whereClause.location = { contains: location, mode: 'insensitive' };
    }
    
    if (minRating) {
      whereClause.ratingAverage = { gte: minRating };
    }
    
    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            }
          },
          reviews: {
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
              user: {
                select: {
                  name: true,
                }
              }
            },
            take: 5, // Limit reviews for performance
            orderBy: { createdAt: 'desc' }
          }
        },
        skip,
        take: limit,
        orderBy: { ratingAverage: 'desc' },
      }),
      prisma.vendor.count({ where: whereClause })
    ]);

    return {
      vendors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  // Get vendor by ID
  static async getVendorById(id: string) {
    return await prisma.vendor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            email: true,
          }
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        bookings: {
          select: {
            id: true,
            status: true,
            amount: true,
            paymentStatus: true,
            createdAt: true,
            event: {
              select: {
                id: true,
                name: true,
                date: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  // Get vendor by user ID
  static async getVendorByUserId(userId: string) {
    return await prisma.vendor.findUnique({
      where: { userId }
    });
  }

  // Create a new vendor profile
  static async createVendor(vendorData: CreateVendorInput) {
    // Check if user already has a vendor profile
    const existingVendor = await prisma.vendor.findUnique({
      where: { userId: vendorData.userId }
    });

    if (existingVendor) {
      throw new Error('Vendor profile already exists for this user');
    }

    // Check if user exists and has the right role
    const user = await prisma.user.findUnique({
      where: { id: vendorData.userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== 'VENDOR') {
      // Update user role to vendor
      await prisma.user.update({
        where: { id: vendorData.userId },
        data: { role: 'VENDOR' }
      });
    }

    return await prisma.vendor.create({
      data: {
        userId: vendorData.userId,
        businessName: vendorData.businessName,
        description: vendorData.description,
        category: vendorData.category,
        pricing: vendorData.pricing,
        location: vendorData.location,
        portfolio: vendorData.portfolio || [],
        availability: vendorData.availability || {},
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          }
        }
      }
    });
  }

  // Update vendor profile
  static async updateVendor(id: string, userId: string, updateData: UpdateVendorInput) {
    // Check if vendor exists and belongs to user
    const vendor = await prisma.vendor.findFirst({
      where: { id, userId }
    });

    if (!vendor) {
      throw new Error('Vendor not found or you do not have permission to update it');
    }

    return await prisma.vendor.update({
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

  // Delete vendor profile
  static async deleteVendor(id: string, userId: string) {
    return await prisma.vendor.delete({
      where: { id, userId }
    });
  }

  // Search vendors by criteria
  static async searchVendors(searchTerm: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const whereClause: any = {
      isVerified: true,
      OR: [
        { businessName: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { category: { contains: searchTerm, mode: 'insensitive' } },
        { location: { contains: searchTerm, mode: 'insensitive' } }
      ]
    };
    
    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            }
          }
        },
        skip,
        take: limit,
        orderBy: { ratingAverage: 'desc' },
      }),
      prisma.vendor.count({ where: whereClause })
    ]);

    return {
      vendors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  // Get featured vendors (highest rated, verified, or paid for featured status)
  static async getFeaturedVendors(filters?: {
    category?: string;
    location?: string;
    limit?: number;
  }) {
    const limit = filters?.limit || 10;
    
    const whereClause: any = { 
      isVerified: true // Only verified vendors can be featured
    };
    
    if (filters?.category) {
      whereClause.category = { contains: filters.category, mode: 'insensitive' };
    }
    
    if (filters?.location) {
      whereClause.location = { contains: filters.location, mode: 'insensitive' };
    }
    
    // Featured vendors could be:
    // 1. Those with featured listings (paid)
    // 2. Highest rated vendors
    // 3. Most reviewed vendors
    // For this implementation, we'll get highest-rated vendors
    const [vendors] = await Promise.all([
      prisma.vendor.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            }
          },
          featuredListings: {
            where: {
              status: 'ACTIVE',
              endDate: { gte: new Date() }
            },
            take: 1 // Only get active featured listings
          }
        },
        take: limit,
        orderBy: [
          { featuredListings: { _count: 'desc' } }, // Prioritize featured listings
          { ratingAverage: 'desc' }, // Then by rating
          { totalReviews: 'desc' }    // Then by review count
        ],
      })
    ]);

    return {
      vendors,
      limit,
      total: vendors.length
    };
  }

  // Update vendor rating after a review
  static async updateVendorRating(vendorId: string) {
    const reviews = await prisma.review.findMany({
      where: { vendorId },
      select: { rating: true }
    });

    if (reviews.length === 0) {
      // Reset to default if no reviews
      await prisma.vendor.update({
        where: { id: vendorId },
        data: { 
          ratingAverage: 0,
          totalReviews: 0
        }
      });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await prisma.vendor.update({
      where: { id: vendorId },
      data: { 
        ratingAverage: averageRating,
        totalReviews: reviews.length
      }
    });
  }
}