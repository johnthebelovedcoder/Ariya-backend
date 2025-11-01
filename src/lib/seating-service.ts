import prisma from './prisma';

interface CreateSeatingInput {
  eventId: string;
  layout: any; // This could be a detailed seating layout structure
}

interface UpdateSeatingInput {
  layout?: any;
}

export class SeatingService {
  // Get seating arrangement by event ID
  static async getSeatingByEventId(eventId: string, userId: string) {
    const seating = await prisma.seating.findUnique({
      where: { eventId },
      include: {
        event: {
          select: {
            userId: true
          }
        }
      }
    });
    
    if (!seating) {
      return null;
    }
    
    // Check if the user has permission to access this seating arrangement
    // The user must be the event owner
    if (seating.event.userId !== userId) {
      return null;
    }
    
    return seating;
  }

  // Create a new seating arrangement
  static async createSeating(seatingData: CreateSeatingInput, userId: string) {
    // Verify the event belongs to the user
    const event = await prisma.event.findUnique({
      where: { id: seatingData.eventId, userId }
    });
    
    if (!event) {
      throw new Error('Event not found or you do not have permission to create a seating arrangement for it');
    }
    
    // Check if seating arrangement already exists for this event
    const existingSeating = await prisma.seating.findUnique({
      where: { eventId: seatingData.eventId }
    });
    
    if (existingSeating) {
      throw new Error('Seating arrangement already exists for this event');
    }
    
    return await prisma.seating.create({
      data: {
        eventId: seatingData.eventId,
        layout: seatingData.layout,
      }
    });
  }

  // Update seating arrangement
  static async updateSeating(eventId: string, userId: string, updateData: UpdateSeatingInput) {
    const seating = await prisma.seating.findUnique({
      where: { eventId },
      include: {
        event: {
          select: {
            userId: true
          }
        }
      }
    });
    
    if (!seating) {
      throw new Error('Seating arrangement not found');
    }
    
    // Check if the user has permission to update this seating arrangement
    // The user must be the event owner
    if (seating.event.userId !== userId) {
      throw new Error('You do not have permission to update this seating arrangement');
    }
    
    return await prisma.seating.update({
      where: { eventId },
      data: updateData
    });
  }

  // Delete seating arrangement
  static async deleteSeating(eventId: string, userId: string) {
    const seating = await prisma.seating.findUnique({
      where: { eventId },
      include: {
        event: {
          select: {
            userId: true
          }
        }
      }
    });
    
    if (!seating) {
      throw new Error('Seating arrangement not found');
    }
    
    // Only event owner can delete a seating arrangement
    if (seating.event.userId !== userId) {
      throw new Error('You do not have permission to delete this seating arrangement');
    }
    
    return await prisma.seating.delete({
      where: { eventId }
    });
  }

  // Update guest seat assignment
  static async assignSeatToGuest(eventId: string, userId: string, guestId: string, seatNumber: string) {
    // Verify the event belongs to the user
    const event = await prisma.event.findUnique({
      where: { id: eventId, userId }
    });
    
    if (!event) {
      throw new Error('Event not found or you do not have permission to assign seats for it');
    }
    
    // Verify the guest belongs to this event
    const guest = await prisma.guest.findUnique({
      where: { id: guestId }
    });
    
    if (!guest || guest.eventId !== eventId) {
      throw new Error('Guest not found or does not belong to this event');
    }
    
    // Update the guest's seat number
    return await prisma.guest.update({
      where: { id: guestId },
      data: { seatNumber }
    });
  }
}