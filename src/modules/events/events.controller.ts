import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Events')
@Controller('v1/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new event' })
  @ApiBody({ description: 'Event data' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  async createEvent(@Body() eventData: any) {
    return await this.eventsService.createEvent(eventData);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiResponse({ status: 200, description: 'Return event information' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getEvent(@Param('id') id: string) {
    const event = await this.eventsService.getEventById(id);
    
    if (!event) {
      throw new Error('Event not found');
    }
    
    return {
      success: true,
      data: event,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all events with optional filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by event status' })
  @ApiQuery({ name: 'location', required: false, type: String, description: 'Filter by location' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'Filter by creator user ID' })
  @ApiResponse({ status: 200, description: 'Return paginated events' })
  async getAllEvents(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('location') location?: string,
    @Query('userId') userId?: string,
  ) {
    // Ensure limits are within acceptable range
    limit = Math.min(limit, 100); // Max 100 items per page
    
    const filters: any = {};
    if (status) filters.status = status;
    if (location) filters.location = location;
    if (userId) filters.userId = userId;

    return await this.eventsService.getAllEvents(Number(page), Number(limit), filters);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update event by ID' })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async updateEvent(@Param('id') id: string, @Body() updateData: any) {
    return await this.eventsService.updateEvent(id, updateData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete event by ID' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async deleteEvent(@Param('id') id: string) {
    return await this.eventsService.deleteEvent(id);
  }
}