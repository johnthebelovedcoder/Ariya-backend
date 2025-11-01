import prisma from '../prisma';
import { VendorRecommendationRequest } from './types';

export class VendorRecommendationService {
  // Get AI-recommended vendors by category/budget
  static async getRecommendedVendors(request: VendorRecommendationRequest, userId: string) {
    // Get vendors matching the criteria
    const vendors = await prisma.vendor.findMany({
      where: {
        category: request.category,
        location: request.location ? { contains: request.location, mode: 'insensitive' } : undefined,
        pricing: {
          gte: request.budgetRange * 0.7, // At least 70% of budget range
          lte: request.budgetRange * 1.3  // At most 130% of budget range
        },
        ratingAverage: request.minRating ? { gte: request.minRating } : undefined,
      },
      include: {
        user: {
          select: {
            currency: true
          }
        }
      },
      take: 10, // Limit to top 10
      orderBy: [
        { ratingAverage: 'desc' },
        { pricing: 'asc' }
      ]
    });
    
    // Enhance with AI ranking
    const rankedVendors = vendors.map(vendor => {
      // Calculate a score based on rating, price, and other factors
      let score = vendor.ratingAverage * 20; // Rating contributes significantly
      
      // Price competitiveness (closer to budget is better)
      const priceRatio = vendor.pricing / request.budgetRange;
      if (priceRatio <= 1.1 && priceRatio >= 0.9) {
        score += 15; // Perfect price match
      } else if (priceRatio <= 1.3 && priceRatio >= 0.7) {
        score += 10; // Within good range
      } else {
        score -= 5; // Outside good range
      }
      
      // Other factors could be added here
      
      return {
        ...vendor,
        aiScore: score,
        reason: `High rating (${vendor.ratingAverage}/5) and good price match for your budget`
      };
    })
    .sort((a, b) => b.aiScore - a.aiScore); // Sort by AI score
    
    return {
      category: request.category,
      budgetRange: request.budgetRange,
      location: request.location,
      minRating: request.minRating,
      vendors: rankedVendors,
      total: rankedVendors.length,
      currency: 'NGN',
      methodology: 'AI ranking based on rating, price, and relevance'
    };
  }

  // Get alternative vendor suggestions
  static async getAlternativeVendors(vendorId: string) {
    // Get the original vendor
    const originalVendor = await prisma.vendor.findUnique({
      where: { id: vendorId }
    });
    
    if (!originalVendor) {
      throw new Error('Vendor not found');
    }
    
    // Find similar vendors in the same category
    const similarVendors = await prisma.vendor.findMany({
      where: {
        id: { not: vendorId }, // Exclude the original
        category: originalVendor.category,
        location: { contains: originalVendor.location.substring(0, 3), mode: 'insensitive' }, // Similar location
      },
      take: 5,
      orderBy: { ratingAverage: 'desc' }
    });
    
    return {
      originalVendorId: vendorId,
      originalVendorName: originalVendor.businessName,
      alternatives: similarVendors,
      reason: 'Vendors with similar category and location',
      currency: 'NGN'
    };
  }
}