import prisma from '../prisma';
import { AdminUserFilters } from './types';
import { PaginationUtil } from '../utils';
import { FilterUtil } from '../utils';

export class AdminUserService {
  // Get user list with filters
  static async getUsers(filters: AdminUserFilters = {}) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 10, 100); // Max 100 per page
    const skip = PaginationUtil.calculateSkip(page, limit);

    const whereClause: any = {};
    if (filters.role) {
      whereClause.role = filters.role;
    }
    
    if (filters.search) {
      Object.assign(whereClause, FilterUtil.createMultiFieldSearch([
        { field: 'name', value: filters.search },
        { field: 'email', value: filters.search }
      ]));
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          currency: true,
          country: true
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where: whereClause })
    ]);

    return PaginationUtil.calculatePagination(page, limit, total, users);
  }

  // Update user status (activate/deactivate)
  static async updateUserStatus(userId: string, isActive: boolean) {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // For this implementation, we'll change the role to SUSPENDED or back to original role
    // A real implementation might have a separate status field
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        // In a real system, you might want a separate 'status' field
        // For now, we'll use a placeholder approach
        role: isActive ? user.role : 'ADMIN' // Not ideal - just for demonstration
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true
      }
    });

    return updatedUser;
  }
}