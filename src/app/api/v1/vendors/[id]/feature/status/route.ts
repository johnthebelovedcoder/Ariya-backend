import { NextRequest } from 'next/server';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';
import prisma from '@/lib/prisma';

// GET /api/vendors/:vendorId/feature/status - Get featured listing status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: vendorId } = params;
    
    if (!vendorId) {
      return createApiError('Vendor ID is required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Verify that the authenticated user owns the vendor profile or is an admin
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId }
    });
    
    if (!vendor) {
      return createApiError('Vendor not found', 404);
    }
    
    if (vendor.userId !== user.id) {
      // Check if user is admin
      if (user.role !== 'ADMIN') {
        return createApiError('You do not have permission to access this vendor\'s feature status', 403);
      }
    }
    
    // In a real implementation, this would check the database for current featured listings
    // For now, return mock data
    const featureStatus = {
      vendorId,
      hasActiveFeature: false, // Whether vendor has an active featured status
      currentFeatures: [], // List of active features
      nextExpiry: null, // Date when current features expire
      eligibility: {
        accountAge: true, // Whether account meets age requirements
        rating: 4.2, // Current vendor rating
        minimumRatingRequired: 4.0,
        profileComplete: true, // Whether profile is complete
        hasActiveListings: true // Whether vendor has active listings
      },
      availableUpgrades: [
        {
          type: 'TOP_SPOT_IN_CATEGORY',
          cost: 15000,
          duration: 30, // days
          description: 'Appear at the top of your category',
          currency: 'NGN'
        },
        {
          type: 'BOOSTED_SEARCH_RESULT',
          cost: 8000,
          duration: 14, // days
          description: 'Appear higher in search results',
          currency: 'NGN'
        }
      ],
      purchaseHistory: [
        {
          id: 'feat_123',
          type: 'TOP_SPOT_IN_CATEGORY',
          amount: 15000,
          startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          purchasedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };
    
    return createApiResponse(featureStatus, 'Featured listing status retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/vendors/[vendorId]/feature/status');
  }
}