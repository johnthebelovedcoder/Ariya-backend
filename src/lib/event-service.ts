import prisma from './prisma';
import { Event, User, Booking, Guest, Budget, Seating, Registry } from '@prisma/client';

interface CreateEventInput {
  userId: string;
  name: string;
  type: string;
  date: Date;
  location: string;
  budget: number;
  guestCount?: number;
  theme?: string;
  notes?: string;
}

interface UpdateEventInput {
  name?: string;
  type?: string;
  date?: Date;
  location?: string;
  budget?: number;
  guestCount?: number;
  theme?: string;
  notes?: string;
  status?: string;
}

export class EventService {
  // Get all events for a user
  static async getUserEvents(
    userId: string, 
    page: number = 1, 
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;
    
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          type: true,
          date: true,
          location: true,
          budget: true,
          status: true,
          guestCount: true,
          theme: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.event.count({ where: { userId } })
    ]);

    return {
      events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  // Get event by ID with related data
  static async getEventById(id: string, userId?: string) {
    const whereClause: { id: string; userId?: string } = { id };
    if (userId) {
      whereClause.userId = userId;
    }
    
    return await prisma.event.findUnique({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        guests: {
          select: {
            id: true,
            name: true,
            email: true,
            rsvp: true,
          },
          orderBy: { name: 'asc' }
        },
        budgets: {
          select: {
            id: true,
            category: true,
            allocated: true,
            actual: true,
          },
          orderBy: { createdAt: 'asc' }
        },
        bookings: {
          select: {
            id: true,
            status: true,
            amount: true,
            paymentStatus: true,
            vendor: {
              select: {
                id: true,
                businessName: true,
                category: true,
              }
            }
          }
        }
      }
    });
  }

  // Create a new event
  static async createEvent(eventData: CreateEventInput) {
    return await prisma.event.create({
      data: {
        userId: eventData.userId,
        name: eventData.name,
        type: eventData.type,
        date: new Date(eventData.date),
        location: eventData.location,
        budget: eventData.budget,
        guestCount: eventData.guestCount || 0,
        theme: eventData.theme,
        notes: eventData.notes,
      },
      select: {
        id: true,
        name: true,
        type: true,
        date: true,
        location: true,
        budget: true,
        status: true,
        guestCount: true,
        theme: true,
        createdAt: true,
        updatedAt: true,
      }
    });
  }

  // Update event
  static async updateEvent(id: string, userId: string, updateData: UpdateEventInput) {
    return await prisma.event.update({
      where: { id, userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        type: true,
        date: true,
        location: true,
        budget: true,
        status: true,
        guestCount: true,
        theme: true,
        updatedAt: true,
      }
    });
  }

  // Delete event
  static async deleteEvent(id: string, userId: string) {
    return await prisma.event.delete({
      where: { id, userId }
    });
  }

  // Get upcoming events for a user
  static async getUpcomingEvents(userId: string) {
    const now = new Date();
    
    return await prisma.event.findMany({
      where: {
        userId,
        date: {
          gte: now
        }
      },
      select: {
        id: true,
        name: true,
        type: true,
        date: true,
        location: true,
        budget: true,
        status: true,
        guestCount: true,
      },
      orderBy: { date: 'asc' }
    });
  }

  // Get past events for a user
  static async getPastEvents(userId: string) {
    const now = new Date();
    
    return await prisma.event.findMany({
      where: {
        userId,
        date: {
          lt: now
        }
      },
      select: {
        id: true,
        name: true,
        type: true,
        date: true,
        location: true,
        budget: true,
        status: true,
        guestCount: true,
      },
      orderBy: { date: 'desc' }
    });
  }
}