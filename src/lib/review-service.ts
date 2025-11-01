import prisma from './prisma';
import { VendorService } from './vendor-service';

interface CreateReviewInput {
  vendorId: string;
  userId: string; // The user who is writing the review
  rating: number; // 1-5 rating
  comment?: string;
}

interface UpdateReviewInput {
  rating?: number;
  comment?: string;
}

export class ReviewService {
  // Get all reviews for a vendor
  static async getVendorReviews(
    vendorId: string, 
    page: number = 1, 
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;
    
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { vendorId },
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
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.count({ where: { vendorId } })
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  // Get a specific review by ID
  static async getReviewById(id: string, userId: string) {
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          }
        },
        vendor: {
          select: {
            id: true,
            userId: true, // Vendor owner ID
          }
        }
      }
    });
    
    if (!review) {
      return null;
    }
    
    // Check if the user has permission to access this review
    // Either they wrote the review, they own the vendor, or it's a public review
    const isReviewAuthor = review.userId === userId;
    const isVendorOwner = review.vendor.userId === userId;
    
    if (!isReviewAuthor && !isVendorOwner) {
      // For public access, only return basic info
      return {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        user: {
          name: review.user.name
        }
      };
    }
    
    // Return full review for authorized users
    return review;
  }

  // Create a new review
  static async createReview(reviewData: CreateReviewInput, userId: string) {
    // Verify that the user exists
    const user = await prisma.user.findUnique({
      where: { id: reviewData.userId }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Verify that the user is the one making the request
    if (reviewData.userId !== userId) {
      throw new Error('You can only submit reviews for yourself');
    }
    
    // Verify that the vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: reviewData.vendorId }
    });
    
    if (!vendor) {
      throw new Error('Vendor not found');
    }
    
    // Check if user has already reviewed this vendor
    const existingReview = await prisma.review.findFirst({
      where: {
        vendorId: reviewData.vendorId,
        userId: reviewData.userId,
      }
    });
    
    if (existingReview) {
      throw new Error('You have already reviewed this vendor');
    }
    
    // Validate rating is between 1 and 5
    if (reviewData.rating < 1 || reviewData.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    
    // Create the review
    const review = await prisma.review.create({
      data: {
        vendorId: reviewData.vendorId,
        userId: reviewData.userId,
        rating: reviewData.rating,
        comment: reviewData.comment,
      },
      include: {
        user: {
          select: {
            name: true,
          }
        },
        vendor: {
          select: {
            businessName: true,
          }
        }
      }
    });
    
    // Update vendor's average rating
    await VendorService.updateVendorRating(reviewData.vendorId);
    
    return review;
  }

  // Update an existing review
  static async updateReview(id: string, userId: string, updateData: UpdateReviewInput) {
    // Get the existing review to check permissions
    const review = await prisma.review.findUnique({
      where: { id }
    });
    
    if (!review) {
      throw new Error('Review not found');
    }
    
    // Only the author of the review can update it
    if (review.userId !== userId) {
      throw new Error('You can only update your own reviews');
    }
    
    // Validate rating if provided
    if (updateData.rating !== undefined) {
      if (updateData.rating < 1 || updateData.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }
    }
    
    // Update the review
    const updatedReview = await prisma.review.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            name: true,
          }
        },
        vendor: {
          select: {
            id: true,
            businessName: true,
          }
        }
      }
    });
    
    // Update vendor's average rating
    await VendorService.updateVendorRating(updatedReview.vendor.id);
    
    return updatedReview;
  }

  // Delete a review
  static async deleteReview(id: string, userId: string) {
    // Get the existing review to check permissions and get vendor ID
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            id: true
          }
        }
      }
    });
    
    if (!review) {
      throw new Error('Review not found');
    }
    
    // Only the author of the review or an admin can delete it
    if (review.userId !== userId) {
      throw new Error('You can only delete your own reviews');
    }
    
    // Delete the review
    const deletedReview = await prisma.review.delete({
      where: { id },
      select: {
        vendorId: true
      }
    });
    
    // Update vendor's average rating
    await VendorService.updateVendorRating(deletedReview.vendorId);
    
    return deletedReview;
  }

  // Get reviews written by a specific user
  static async getUserReviews(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { userId },
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
      prisma.review.count({ where: { userId } })
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }
}