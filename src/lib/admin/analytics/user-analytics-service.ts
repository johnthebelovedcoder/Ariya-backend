import prisma from '../../prisma';

export class AdminUserAnalyticsService {
  // Get user acquisition metrics
  static async getUserAcquisitionMetrics() {
    // Get user count grouped by creation date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyStats = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      _count: true,
    });

    // Format data for the chart
    const result = dailyStats.map(stat => ({
      date: stat.createdAt.toISOString().split('T')[0],
      count: stat._count
    }));

    return {
      totalUsers: await prisma.user.count(),
      dailyStats: result,
      averageDailyGrowth: result.length > 0 ? 
        result.reduce((sum, day) => sum + day.count, 0) / result.length : 0
    };
  }
}