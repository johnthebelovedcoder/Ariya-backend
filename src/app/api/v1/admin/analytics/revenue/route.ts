import { NextRequest } from 'next/server';
import { PaymentService } from '@/lib/payment-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/admin/analytics/revenue - Get revenue metrics
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Verify user is admin
    const adminService = await import('@/lib/admin-service');
    const isAdmin = await adminService.AdminService.verifyAdmin(user.id);
    if (!isAdmin) {
      return createApiError('Access denied. Admin privileges required.', 403);
    }
    
    // Calculate revenue metrics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get paid payments from last 30 days
    const recentPayments = await (await import('@/lib/prisma')).default.payment.findMany({
      where: {
        status: 'PAID',
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        amount: true,
        currency: true,
        createdAt: true
      }
    });
    
    // Calculate total revenue
    const totalRevenue = recentPayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Calculate daily revenue
    const dailyRevenue: Record<string, number> = {};
    recentPayments.forEach(payment => {
      const date = payment.createdAt.toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + payment.amount;
    });
    
    const revenueData = Object.entries(dailyRevenue).map(([date, amount]) => ({
      date,
      revenue: amount
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return createApiResponse({
      totalRevenue,
      currency: recentPayments[0]?.currency || 'NGN',
      dailyRevenue: revenueData,
      period: 'last_30_days',
      averageDailyRevenue: revenueData.length > 0 ? totalRevenue / revenueData.length : 0
    }, 'Revenue metrics retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/admin/analytics/revenue');
  }
}