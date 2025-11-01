import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async createEvent(eventData: any) {
    try {
      const event = await this.prisma.event.create({
        data: {
          name: eventData.name || eventData.title, // Use name instead of title
          notes: eventData.notes || eventData.description,  // Use notes instead of description
          location: eventData.location,
          date: new Date(eventData.date || eventData.startDate), // Use date instead of startDate
          userId: eventData.userId, // Creator of the event
          status: eventData.status || 'DRAFT',
          guestCount: eventData.guestCount || eventData.capacity || 0, // Use guestCount instead of capacity
          budget: eventData.budget || eventData.price || 0, // Use budget instead of price
          type: eventData.type || 'EVENT',
          theme: eventData.theme || '', // Add theme if available
        },
      });

      this.logger.info('Event created successfully', { eventId: event.id, userId: event.userId });

      return event;
    } catch (error) {
      this.logger.error('Error creating event', { error: error.message, eventData });
      throw error;
    }
  }

  async getEventById(eventId: string) {
    try {
      const event = await this.prisma.event.findUnique({
        where: { id: eventId },
        include: {
          user: {  // Use user instead of creator
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });

      return event;
    } catch (error) {
      this.logger.error('Error finding event by ID', { eventId, error: error.message });
      throw error;
    }
  }

  async getAllEvents(page: number = 1, limit: number = 10, filters: any = {}) {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause: any = {};
      if (filters.status) {
        whereClause.status = filters.status;
      }
      if (filters.location) {
        whereClause.location = { contains: filters.location, mode: 'insensitive' };
      }
      if (filters.userId) {
        whereClause.userId = filters.userId;
      }

      const events = await this.prisma.event.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: {
          date: 'asc',  // Use date instead of startDate
        },
        include: {
          user: {  // Use user instead of creator
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });

      const total = await this.prisma.event.count({
        where: whereClause,
      });
      
      return {
        data: events,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Error finding all events', { error: error.message, filters });
      throw error;
    }
  }

  async updateEvent(eventId: string, updateData: any) {
    try {
      const prismaUpdateData: any = {};
      
      if (updateData.name) prismaUpdateData.name = updateData.name;
      if (updateData.notes || updateData.description) prismaUpdateData.notes = updateData.notes || updateData.description;
      if (updateData.location) prismaUpdateData.location = updateData.location;
      if (updateData.date) prismaUpdateData.date = new Date(updateData.date);
      if (updateData.status) prismaUpdateData.status = updateData.status;
      if (updateData.guestCount || updateData.capacity) prismaUpdateData.guestCount = updateData.guestCount || updateData.capacity;
      if (updateData.budget || updateData.price) prismaUpdateData.budget = updateData.budget || updateData.price;
      if (updateData.type) prismaUpdateData.type = updateData.type;
      if (updateData.theme) prismaUpdateData.theme = updateData.theme;
      
      const updatedEvent = await this.prisma.event.update({
        where: { id: eventId },
        data: prismaUpdateData,
      });

      this.logger.info('Event updated successfully', { eventId });

      return updatedEvent;
    } catch (error) {
      this.logger.error('Error updating event', { eventId, error: error.message });
      throw error;
    }
  }

  async deleteEvent(eventId: string) {
    try {
      await this.prisma.event.delete({
        where: { id: eventId },
      });

      this.logger.info('Event deleted successfully', { eventId });

      return { message: 'Event deleted successfully' };
    } catch (error) {
      this.logger.error('Error deleting event', { eventId, error: error.message });
      throw error;
    }
  }
}