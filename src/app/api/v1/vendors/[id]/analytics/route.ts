import { NextRequest } from 'next/server';
import { VendorService } from '@/lib/vendor-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/vendors/[vendorId]/analytics - Get vendor performance analytics
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
    
    // Verify this is the vendor's account or an admin
    const vendor = await VendorService.getVendorById(vendorId);
    if (!vendor || vendor.userId !== user.id) {
      // Check if user is admin
      if (user.role !== 'ADMIN') {
        return createApiError('You do not have permission to view this vendor\'s analytics', 403);
      }
    }
    
    // In a real implementation, this would fetch comprehensive analytics data
    // For now, return mock analytics data
    const analyticsData = {
      vendorId,
      period: 'last_30_days',
      bookings: {
        total: 15,
        confirmed: 12,
        pending: 2,
        cancelled: 1,
        conversionRate: 80.0 // 80% of inquiries converted to bookings
      },
      revenue: {
        total: 450000, // in vendor's currency
        currency: vendor?.user?.currency || 'NGN',
        averagePerBooking: 37500,
        growthRate: 15.5 // 15.5% growth compared to previous period
      },
      reviews: {
        total: 24,
        averageRating: 4.6,
        positive: 22,
        negative: 2,
        responseRate: 90.0 // 90% of reviews responded to
      },
      inquiries: {
        total: 32,
        responded: 28,
        responseRate: 87.5,
        conversionRate: 37.5 // 37.5% of inquiries converted to bookings
      },
      performanceMetrics: {
        bookingRate: 2.5, // Average 2.5 bookings per week
        averageBookingValue: 37500,
        repeatCustomerRate: 15.0, // 15% of customers book again
        daysBooked: 45 // Number of days booked in the period
      },
      trends: [
        {
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          bookings: 3,
          revenue: 85000
        },
        {
          date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          bookings: 1,
          revenue: 25000
        },
        {
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          bookings: 2,
          revenue: 60000
        }
      ]
    };
    
    return createApiResponse(analyticsData, 'Vendor analytics retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/vendors/[vendorId]/analytics');
  }
}