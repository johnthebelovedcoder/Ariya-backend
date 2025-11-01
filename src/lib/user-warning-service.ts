import prisma from './prisma';
import { UserWarning } from '@prisma/client';

interface CreateUserWarningInput {
  userId: string;
  reason: string;
  issuedBy?: string; // ID of admin/user who issued the warning
  isAutomated?: boolean; // Whether it was an automated warning
}

export class UserWarningService {
  // Get all warnings for a user
  static async getUserWarnings(userId: string, requestingUserId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    // Only admins or the user themselves can view warnings
    const requestingUser = await prisma.user.findUnique({
      where: { id: requestingUserId }
    });
    
    if (!requestingUser) {
      throw new Error('Requesting user not found');
    }
    
    // Check if requesting user is admin or same user
    const isSelf = userId === requestingUserId;
    const isAdmin = requestingUser.role === 'ADMIN';
    
    if (!isSelf && !isAdmin) {
      throw new Error('You do not have permission to view this user\'s warnings');
    }
    
    const [warnings, total] = await Promise.all([
      prisma.userWarning.findMany({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.userWarning.count({ where: { userId } })
    ]);

    return {
      warnings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  // Get warning by ID
  static async getWarningById(id: string, requestingUserId: string) {
    const warning = await prisma.userWarning.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            userId: true // The user who received the warning
          }
        }
      }
    });
    
    if (!warning) {
      return null;
    }
    
    // Check if requesting user is admin or same as warned user
    const requestingUser = await prisma.user.findUnique({
      where: { id: requestingUserId }
    });
    
    if (!requestingUser) {
      throw new Error('Requesting user not found');
    }
    
    const isWarnedUser = warning.user.userId === requestingUserId;
    const isAdmin = requestingUser.role === 'ADMIN';
    
    if (!isWarnedUser && !isAdmin) {
      throw new Error('You do not have permission to view this warning');
    }
    
    return warning;
  }

  // Create a new user warning
  static async createUserWarning(warningData: CreateUserWarningInput, adminUserId?: string) {
    // If not automated, verify admin user exists
    if (!warningData.isAutomated && adminUserId) {
      const adminUser = await prisma.user.findUnique({
        where: { id: adminUserId }
      });
      
      if (!adminUser || adminUser.role !== 'ADMIN') {
        throw new Error('Only administrators can issue manual warnings');
      }
      
      warningData.issuedBy = adminUserId;
    } else if (!warningData.isAutomated) {
      // If it's not automated and no admin ID provided, set to system
      warningData.issuedBy = 'SYSTEM';
    }
    
    // Verify the user to be warned exists
    const userToWarn = await prisma.user.findUnique({
      where: { id: warningData.userId }
    });
    
    if (!userToWarn) {
      throw new Error('User not found');
    }

    return await prisma.userWarning.create({
      data: {
        userId: warningData.userId,
        reason: warningData.reason,
        issuedBy: warningData.issuedBy || 'SYSTEM',
        isAutomated: warningData.isAutomated || false,
        createdAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
  }

  // Count warnings for a user within a time period
  static async countUserWarnings(userId: string, daysAgo: number = 30): Promise<number> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - daysAgo);
    
    const count = await prisma.userWarning.count({
      where: {
        userId,
        createdAt: { gte: sinceDate }
      }
    });
    
    return count;
  }

  // Get all warnings (admin only)
  static async getAllWarnings(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [warnings, total] = await Promise.all([
      prisma.userWarning.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.userWarning.count()
    ]);

    return {
      warnings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  // Get recent warnings for a user
  static async getUserRecentWarnings(userId: string, daysAgo: number = 30) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - daysAgo);
    
    return await prisma.userWarning.findMany({
      where: {
        userId,
        createdAt: { gte: sinceDate }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}