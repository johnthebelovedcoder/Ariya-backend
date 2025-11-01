import prisma from '../../prisma';

export class AdminVendorAnalyticsService {
  // Get vendor performance metrics
  static async getVendorPerformanceMetrics() {
    const vendors = await prisma.vendor.findMany({
      include: {
        _count: {
          select: {
            bookings: true
          }
        },
        bookings: {
          where: {
            paymentStatus: 'PAID'
          },
          select: {
            amount: true
          }
        }
      },
      take: 20, // Top 20 vendors
      orderBy: { totalReviews: 'desc' } // Order by review count
    });

    // Calculate performance metrics for each vendor
    const vendorPerformance = vendors.map(vendor => {
      const totalRevenue = vendor.bookings.reduce((sum, booking) => sum + booking.amount, 0);
      const totalBookings = vendor._count.bookings;
      
      return {
        id: vendor.id,
        businessName: vendor.businessName,
        category: vendor.category,
        rating: vendor.ratingAverage,
        totalReviews: vendor.totalReviews,
        totalBookings,
        totalRevenue,
        performanceScore: totalRevenue * vendor.ratingAverage / 100 // Example score
      };
    }).sort((a, b) => b.performanceScore - a.performanceScore);

    return {
      vendorPerformance,
      totalVendors: vendors.length
    };
  }
}