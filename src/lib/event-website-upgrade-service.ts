import prisma from './prisma';
import { EventWebsiteUpgrade } from '@prisma/client';

interface CreateEventWebsiteUpgradeInput {
  eventId: string;
  type: string; // 'CUSTOM_DOMAIN', 'PREMIUM_TEMPLATE', 'ADDITIONAL_STORAGE'
  amount: number;
  paymentStatus?: string;
  details?: any;
  expiresAt?: Date;
}

interface UpdateEventWebsiteUpgradeInput {
  status?: string;
  paymentStatus?: string;
  details?: any;
  expiresAt?: Date;
}

export class EventWebsiteUpgradeService {
  // Get all website upgrades for an event
  static async getEventWebsiteUpgrades(eventId: string, userId: string) {
    // Verify the event belongs to the user
    const event = await prisma.event.findUnique({
      where: { id: eventId, userId }
    });
    
    if (!event) {
      throw new Error('Event not found or you do not have permission to access it');
    }
    
    return await prisma.eventWebsiteUpgrade.findMany({
      where: { eventId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        }
      },
      orderBy: { purchasedAt: 'desc' },
    });
  }

  // Get website upgrade by ID
  static async getEventWebsiteUpgradeById(id: string, userId: string) {
    const upgrade = await prisma.eventWebsiteUpgrade.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            userId: true
          }
        }
      }
    });
    
    if (!upgrade) {
      return null;
    }
    
    // Check if the user has permission to access this upgrade
    if (upgrade.event.userId !== userId) {
      return null;
    }
    
    return upgrade;
  }

  // Create a new event website upgrade
  static async createEventWebsiteUpgrade(upgradeData: CreateEventWebsiteUpgradeInput, userId: string) {
    // Verify the event belongs to the user and get user's currency
    const event = await prisma.event.findUnique({
      where: { id: upgradeData.eventId, userId },
      include: {
        user: {
          select: { currency: true }
        }
      }
    });
    
    if (!event || !event.user) {
      throw new Error('Event not found or you do not have permission to upgrade it');
    }

    // Check if this type of upgrade already exists and is still active
    if (upgradeData.type === 'CUSTOM_DOMAIN') {
      const existingDomain = await prisma.eventWebsiteUpgrade.findFirst({
        where: {
          eventId: upgradeData.eventId,
          type: 'CUSTOM_DOMAIN',
          expiresAt: { gte: new Date() }
        }
      });

      if (existingDomain) {
        throw new Error('A custom domain is already active for this event');
      }
    }

    return await prisma.eventWebsiteUpgrade.create({
      data: {
        eventId: upgradeData.eventId,
        type: upgradeData.type,
        amount: upgradeData.amount,
        currency: event.user.currency || 'NGN', // Use event owner's currency
        status: 'PENDING',
        paymentStatus: upgradeData.paymentStatus || 'PENDING',
        details: upgradeData.details,
        purchasedAt: new Date(),
        expiresAt: upgradeData.expiresAt,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        }
      }
    });
  }

  // Update an event website upgrade
  static async updateEventWebsiteUpgrade(id: string, userId: string, updateData: UpdateEventWebsiteUpgradeInput) {
    const upgrade = await prisma.eventWebsiteUpgrade.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            userId: true
          }
        }
      }
    });
    
    if (!upgrade) {
      throw new Error('Website upgrade not found');
    }
    
    // Check if the user has permission to update this upgrade
    if (upgrade.event.userId !== userId) {
      throw new Error('You do not have permission to update this website upgrade');
    }

    return await prisma.eventWebsiteUpgrade.update({
      where: { id },
      data: updateData,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        }
      }
    });
  }

  // Cancel an event website upgrade
  static async cancelEventWebsiteUpgrade(id: string, userId: string) {
    const upgrade = await prisma.eventWebsiteUpgrade.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            userId: true
          }
        }
      }
    });
    
    if (!upgrade) {
      throw new Error('Website upgrade not found');
    }
    
    // Check if the user has permission to cancel this upgrade
    if (upgrade.event.userId !== userId) {
      throw new Error('You do not have permission to cancel this website upgrade');
    }

    return await prisma.eventWebsiteUpgrade.update({
      where: { id },
      data: { 
        status: 'CANCELLED',
        expiresAt: new Date() // Set expiration to now
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        }
      }
    });
  }

  // Check if event has active upgrade of a specific type
  static async eventHasActiveUpgrade(eventId: string, type?: string): Promise<boolean> {
    const whereClause: any = {
      eventId,
      status: { in: ['PENDING', 'ACTIVE'] },
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } }
      ]
    };

    if (type) {
      whereClause.type = type;
    }

    const upgrade = await prisma.eventWebsiteUpgrade.findFirst({
      where: whereClause
    });

    return upgrade !== null;
  }
}