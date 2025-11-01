import prisma from '../prisma';
import { AdminVendorFilters } from './types';

export class AdminVendorService {
  // Get pending vendor approvals
  static async getPendingVendors(filters: AdminVendorFilters = {}) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 10, 100);
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    
    // For pending vendors, we might need to check if they're new or have specific status
    // Assuming pending vendors are those that need review
    whereClause.isVerified = false; // Assuming unverified vendors need approval

    if (filters.category) {
      whereClause.category = { contains: filters.category, mode: 'insensitive' };
    }
    if (filters.search) {
      whereClause.OR = [
        { businessName: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { user: { name: { contains: filters.search, mode: 'insensitive' } } }
      ];
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.vendor.count({ where: whereClause })
    ]);

    return {
      vendors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Approve vendor
  static async approveVendor(vendorId: string, adminUserId: string) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!vendor) {
      throw new Error('Vendor not found');
    }

    const updatedVendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        isVerified: true,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return updatedVendor;
  }

  // Reject vendor
  static async rejectVendor(vendorId: string, adminUserId: string, reason: string) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!vendor) {
      throw new Error('Vendor not found');
    }

    // Instead of deleting, we can mark as rejected or update status
    const updatedVendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        isVerified: false, // Keep as unverified
        // In a real system, you might want to add a status field or rejection reason
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return updatedVendor;
  }
}