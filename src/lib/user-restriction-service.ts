import prisma from './prisma';
import { UserRestriction, User } from '@prisma/client';

interface CreateUserRestrictionInput {
  userId: string;
  type: string; // 'MESSAGING_RESTRICTION', 'ACCOUNT_SUSPENSION', 'FEATURE_LOCK'
  reason: string;
  expiresAt?: Date;
}

interface UpdateUserRestrictionInput {
  reason?: string;
  expiresAt?: Date;
  removedBy?: string;
  removedAt?: Date;
  removalReason?: string;
}

export class UserRestrictionService {
  // Get all restrictions for a user
  static async getUserRestrictions(userId: string, requestingUserId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    // Only admins or the user themselves can view restrictions
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
      throw new Error('You do not have permission to view this user\'s restrictions');
    }
    
    const [restrictions, total] = await Promise.all([
      prisma.userRestriction.findMany({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          removedByUser: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.userRestriction.count({ where: { userId } })
    ]);

    return {
      restrictions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  // Get active restrictions for a user
  static async getUserActiveRestrictions(userId: string) {
    return await prisma.userRestriction.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
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

  // Get restriction by ID
  static async getRestrictionById(id: string, requestingUserId: string) {
    const restriction = await prisma.userRestriction.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            userId: true // The user who is restricted
          }
        }
      }
    });
    
    if (!restriction) {
      return null;
    }
    
    // Check if requesting user is admin or same as restricted user
    const requestingUser = await prisma.user.findUnique({
      where: { id: requestingUserId }
    });
    
    if (!requestingUser) {
      throw new Error('Requesting user not found');
    }
    
    const isRestrictedUser = restriction.user.userId === requestingUserId;
    const isAdmin = requestingUser.role === 'ADMIN';
    
    if (!isRestrictedUser && !isAdmin) {
      throw new Error('You do not have permission to view this restriction');
    }
    
    return restriction;
  }

  // Create a new user restriction
  static async createUserRestriction(restrictionData: CreateUserRestrictionInput, adminUserId: string) {
    // Verify admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { id: adminUserId }
    });
    
    if (!adminUser || adminUser.role !== 'ADMIN') {
      throw new Error('Only administrators can create restrictions');
    }

    // Verify the user to be restricted exists
    const userToRestrict = await prisma.user.findUnique({
      where: { id: restrictionData.userId }
    });
    
    if (!userToRestrict) {
      throw new Error('User not found');
    }

    // Check if user already has an active restriction of the same type
    const existingActiveRestriction = await prisma.userRestriction.findFirst({
      where: {
        userId: restrictionData.userId,
        type: restrictionData.type,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      }
    });

    if (existingActiveRestriction) {
      throw new Error('User already has an active restriction of this type');
    }

    return await prisma.userRestriction.create({
      data: {
        userId: restrictionData.userId,
        type: restrictionData.type,
        reason: restrictionData.reason,
        expiresAt: restrictionData.expiresAt,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
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

  // Update a user restriction (typically to extend or modify)
  static async updateUserRestriction(id: string, adminUserId: string, updateData: UpdateUserRestrictionInput) {
    // Verify admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { id: adminUserId }
    });
    
    if (!adminUser || adminUser.role !== 'ADMIN') {
      throw new Error('Only administrators can update restrictions');
    }

    const restriction = await prisma.userRestriction.findUnique({
      where: { id }
    });
    
    if (!restriction) {
      throw new Error('Restriction not found');
    }

    return await prisma.userRestriction.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
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

  // Remove (deactivate) a user restriction
  static async removeUserRestriction(id: string, adminUserId: string, removalReason: string) {
    // Verify admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { id: adminUserId }
    });
    
    if (!adminUser || adminUser.role !== 'ADMIN') {
      throw new Error('Only administrators can remove restrictions');
    }

    const restriction = await prisma.userRestriction.findUnique({
      where: { id }
    });
    
    if (!restriction) {
      throw new Error('Restriction not found');
    }

    return await prisma.userRestriction.update({
      where: { id },
      data: {
        isActive: false,
        removedBy: adminUserId,
        removedAt: new Date(),
        removalReason,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        removedByUser: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
  }

  // Check if user has an active restriction of given type
  static async userHasActiveRestriction(userId: string, type?: string): Promise<boolean> {
    const whereClause: any = {
      userId,
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } }
      ]
    };

    if (type) {
      whereClause.type = type;
    }

    const restriction = await prisma.userRestriction.findFirst({
      where: whereClause
    });

    return restriction !== null;
  }

  // Get all active restrictions for all users (for admin dashboard)
  static async getAllActiveRestrictions(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [restrictions, total] = await Promise.all([
      prisma.userRestriction.findMany({
        where: {
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } }
          ]
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          removedByUser: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.userRestriction.count({
        where: {
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } }
          ]
        }
      })
    ]);

    return {
      restrictions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }
}