import prisma from '../../prisma';

export class AdminEventAnalyticsService {
  // Get event creation metrics
  static async getEventCreationMetrics(filters?: {
    startDate?: Date;
    endDate?: Date;
    eventType?: string;
  }) {
    const whereClause: any = {};
    
    if (filters?.startDate) {
      whereClause.createdAt = { ...whereClause.createdAt, gte: filters.startDate };
    }
    
    if (filters?.endDate) {
      whereClause.createdAt = { ...whereClause.createdAt, lte: filters.endDate };
    }
    
    if (filters?.eventType) {
      whereClause.type = { contains: filters.eventType, mode: 'insensitive' };
    }

    const [events, eventStats] = await Promise.all([
      prisma.event.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 100 // Limit results for performance
      }),
      prisma.event.aggregate({
        where: whereClause,
        _count: true,
        _sum: { budget: true }
      })
    ]);

    // Calculate additional metrics
    const totalBudget = eventStats._sum.budget || 0;
    const averageBudget = events.length > 0 ? totalBudget / events.length : 0;

    return {
      events,
      totalEvents: eventStats._count,
      totalBudget,
      averageBudget,
      createdAt: new Date()
    };
  }
}