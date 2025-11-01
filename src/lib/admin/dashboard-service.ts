import prisma from '../prisma';
import { AdminDashboardMetrics } from './types';

export class AdminDashboardService {
  // Get admin dashboard metrics
  static async getDashboardMetrics(): Promise<AdminDashboardMetrics> {
    const [
      totalUsers,
      totalVendors,
      totalEvents,
      totalBookings,
      totalPayments
    ] = await Promise.all([
      prisma.user.count(),
      prisma.vendor.count(),
      prisma.event.count(),
      prisma.booking.count(),
      prisma.payment.count({
        where: { status: 'PAID' }
      })
    ]);

    // Calculate total revenue from paid payments
    const paidPayments = await prisma.payment.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true }
    });

    // Calculate monthly growth by comparing last month to previous month
    const lastMonthStart = new Date();
    lastMonthStart.setDate(1);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    const prevMonthStart = new Date();
    prevMonthStart.setDate(1);
    prevMonthStart.setMonth(prevMonthStart.getMonth() - 2);

    const [lastMonthUsers, prevMonthUsers] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: {
            gte: lastMonthStart,
            lt: new Date(lastMonthStart.getFullYear(), lastMonthStart.getMonth() + 1, 1)
          }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: prevMonthStart,
            lt: new Date(prevMonthStart.getFullYear(), prevMonthStart.getMonth() + 1, 1)
          }
        }
      })
    ]);

    let monthlyGrowth = 0;
    if (prevMonthUsers > 0) {
      monthlyGrowth = ((lastMonthUsers - prevMonthUsers) / prevMonthUsers) * 100;
    } else if (lastMonthUsers > 0 && prevMonthUsers === 0) {
      monthlyGrowth = 100; // New growth from 0
    }

    return {
      totalUsers,
      totalVendors,
      totalEvents,
      totalBookings,
      totalRevenue: paidPayments._sum.amount || 0,
      monthlyGrowth
    };
  }
}