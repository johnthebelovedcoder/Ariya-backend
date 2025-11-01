import prisma from '../../prisma';

export class AdminBookingAnalyticsService {
  // Get booking metrics
  static async getBookingMetrics() {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [bookings, bookingStats, paymentStats] = await Promise.all([
      prisma.booking.findMany({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        },
        include: {
          vendor: {
            select: {
              businessName: true
            }
          },
          event: {
            select: {
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      }),
      prisma.booking.aggregate({
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: true,
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: { 
          createdAt: { gte: thirtyDaysAgo },
          status: 'PAID'
        },
        _sum: { amount: true }
      })
    ]);

    return {
      recentBookings: bookings,
      totalBookings: bookingStats._count,
      totalBookingValue: bookingStats._sum.amount || 0,
      totalRevenue: paymentStats._sum.amount || 0,
      bookingTrend: bookingStats._count > 0
    };
  }
}