import prisma from './prisma';
import { Guest, RSVPStatus } from '@prisma/client';

interface CreateGuestInput {
  eventId: string;
  name: string;
  email: string;
  dietaryRestrictions?: string;
  invitedBy: string;
}

interface UpdateGuestInput {
  name?: string;
  email?: string;
  rsvp?: RSVPStatus;
  dietaryRestrictions?: string;
  seatNumber?: string;
}

export class GuestService {
  // Get all guests for an event
  static async getEventGuests(
    eventId: string,
    userId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;
    
    // First verify the event belongs to the user
    const event = await prisma.event.findUnique({
      where: { id: eventId, userId }
    });
    
    if (!event) {
      throw new Error('Event not found or you do not have permission to access it');
    }
    
    const [guests, total] = await Promise.all([
      prisma.guest.findMany({
        where: { eventId },
        select: {
          id: true,
          name: true,
          email: true,
          rsvp: true,
          dietaryRestrictions: true,
          seatNumber: true,
          createdAt: true,
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.guest.count({ where: { eventId } })
    ]);

    return {
      guests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  // Get guest by ID
  static async getGuestById(id: string, userId: string) {
    const guest = await prisma.guest.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            userId: true
          }
        }
      }
    });
    
    if (!guest) {
      return null;
    }
    
    // Check if the user has permission to access this guest
    // The user must be the event owner
    if (guest.event.userId !== userId) {
      return null;
    }
    
    // Return guest without event reference to avoid circular reference
    const { event: _, ...guestData } = guest;
    
    return {
      id: guestData.id,
      eventId: guestData.eventId,
      name: guestData.name,
      email: guestData.email,
      rsvp: guestData.rsvp,
      dietaryRestrictions: guestData.dietaryRestrictions,
      seatNumber: guestData.seatNumber,
      invitedBy: guestData.invitedBy,
      createdAt: guestData.createdAt,
      updatedAt: guestData.updatedAt,
    };
  }

  // Create a new guest
  static async createGuest(guestData: CreateGuestInput, userId: string) {
    // Verify the event belongs to the user
    const event = await prisma.event.findUnique({
      where: { id: guestData.eventId, userId }
    });
    
    if (!event) {
      throw new Error('Event not found or you do not have permission to add guests to it');
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestData.email)) {
      throw new Error('Invalid email format');
    }
    
    // Check if guest already exists for this event
    const existingGuest = await prisma.guest.findFirst({
      where: {
        eventId: guestData.eventId,
        email: guestData.email,
      }
    });
    
    if (existingGuest) {
      throw new Error('Guest with this email already exists for this event');
    }
    
    // Update the guest count in the event
    await prisma.event.update({
      where: { id: guestData.eventId },
      data: {
        guestCount: {
          increment: 1
        }
      }
    });
    
    return await prisma.guest.create({
      data: {
        eventId: guestData.eventId,
        name: guestData.name,
        email: guestData.email,
        dietaryRestrictions: guestData.dietaryRestrictions,
        invitedBy: guestData.invitedBy,
        rsvp: 'MAYBE', // Default RSVP status
      },
      select: {
        id: true,
        name: true,
        email: true,
        rsvp: true,
        dietaryRestrictions: true,
        seatNumber: true,
        createdAt: true,
      }
    });
  }

  // Update guest
  static async updateGuest(id: string, userId: string, updateData: UpdateGuestInput) {
    const guest = await prisma.guest.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            userId: true
          }
        }
      }
    });
    
    if (!guest) {
      throw new Error('Guest not found');
    }
    
    // Check if the user has permission to update this guest
    // The user must be the event owner
    if (guest.event.userId !== userId) {
      throw new Error('You do not have permission to update this guest');
    }
    
    // If updating email, validate format
    if (updateData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        throw new Error('Invalid email format');
      }
      
      // Check if new email already exists for this event (excluding current guest)
      const existingGuest = await prisma.guest.findFirst({
        where: {
          eventId: guest.eventId,
          email: updateData.email,
          NOT: { id: guest.id }
        }
      });
      
      if (existingGuest) {
        throw new Error('Guest with this email already exists for this event');
      }
    }
    
    return await prisma.guest.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        rsvp: true,
        dietaryRestrictions: true,
        seatNumber: true,
        updatedAt: true,
      }
    });
  }

  // Delete guest
  static async deleteGuest(id: string, userId: string) {
    const guest = await prisma.guest.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            userId: true
          }
        }
      }
    });
    
    if (!guest) {
      throw new Error('Guest not found');
    }
    
    // Only event owner can delete a guest
    if (guest.event.userId !== userId) {
      throw new Error('You do not have permission to delete this guest');
    }
    
    // Delete the guest
    const deletedGuest = await prisma.guest.delete({
      where: { id },
      select: {
        id: true,
        eventId: true,
      }
    });
    
    // Update the guest count in the event
    await prisma.event.update({
      where: { id: deletedGuest.eventId },
      data: {
        guestCount: {
          decrement: 1
        }
      }
    });
    
    return deletedGuest;
  }

  // Update RSVP status for a guest (can be done by the guest themselves with a token)
  static async updateGuestRSVP(id: string, rsvpStatus: RSVPStatus) {
    // For this function, we don't check user permissions as it can be done by the guest
    // The caller of this function should validate the guest identity in a different way
    return await prisma.guest.update({
      where: { id },
      data: { rsvp: rsvpStatus },
      select: {
        id: true,
        rsvp: true,
        updatedAt: true,
      }
    });
  }

  // Get RSVP status for an email and event
  static async getGuestByEmailAndEvent(email: string, eventId: string) {
    return await prisma.guest.findFirst({
      where: {
        email,
        eventId
      },
      select: {
        id: true,
        name: true,
        rsvp: true,
        dietaryRestrictions: true,
      }
    });
  }
}