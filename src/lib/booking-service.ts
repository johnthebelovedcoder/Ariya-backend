import prisma from './prisma';
import { ModerationService } from './moderation-service';
import { PaymentCalculationService } from './payment-calculation-service';
import { Booking, BookingStatus, PaymentStatus, Vendor, Event } from '@prisma/client';

interface CreateBookingInput {
  eventId: string;
  vendorId: string;
  amount: number;
  notes?: string;
}

interface UpdateBookingInput {
  status?: BookingStatus;
  amount?: number;
  notes?: string;
  paymentStatus?: PaymentStatus;
}

export class BookingService {
  // Get all bookings for an event
  static async getEventBookings(
    eventId: string,
    userId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;
    
    // First verify the event belongs to the user
    const event = await prisma.event.findUnique({
      where: { id: eventId, userId }
    });
    
    if (!event) {
      throw new Error('Event not found or you do not have permission to access it');
    }
    
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: { eventId },
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
              category: true,
              location: true,
              ratingAverage: true,
            }
          },
          event: {
            select: {
              id: true,
              name: true,
              date: true,
              location: true,
            }
          },
          payment: {
            select: {
              id: true,
              status: true,
              amount: true,
              paymentMethod: true,
              timestamp: true,
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.count({ where: { eventId } })
    ]);

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  // Get all bookings for a vendor
  static async getVendorBookings(
    vendorId: string,
    userId: string,
    page: number = 1,
    limit: number = 10
  ) {
    // First verify the vendor belongs to the user
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId, userId }
    });
    
    if (!vendor) {
      throw new Error('Vendor not found or you do not have permission to access it');
    }
    
    const skip = (page - 1) * limit;
    
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: { vendorId },
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
            }
          },
          event: {
            select: {
              id: true,
              name: true,
              date: true,
              location: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              }
            }
          },
          payment: {
            select: {
              id: true,
              status: true,
              amount: true,
              paymentMethod: true,
              timestamp: true,
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.count({ where: { vendorId } })
    ]);

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  // Get booking by ID
  static async getBookingById(id: string, userId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            category: true,
            location: true,
            ratingAverage: true,
          }
        },
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            location: true,
            userId: true,
          }
        },
        payment: {
          select: {
            id: true,
            status: true,
            amount: true,
            paymentMethod: true,
            timestamp: true,
          }
        }
      }
    });
    
    if (!booking) {
      return null;
    }
    
    // Check if the user has permission to access this booking
    // Either they are the event owner or the vendor
    const isEventOwner = booking.event.userId === userId;
    const isVendor = booking.vendor.userId === userId;
    
    if (!isEventOwner && !isVendor) {
      return null;
    }
    
    return booking;
  }

  // Create a new booking with commission calculations
  static async createBooking(bookingData: CreateBookingInput, userId: string) {
    // Check if user has booking restrictions
    const actionCheck = await ModerationService.canUserPerformAction(userId, 'BOOK');
    if (!actionCheck.canPerform) {
      throw new Error(`Booking is restricted: ${actionCheck.reason}`);
    }
    
    // Verify the event belongs to the user
    const event = await prisma.event.findUnique({
      where: { id: bookingData.eventId, userId }
    });
    
    if (!event) {
      throw new Error('Event not found or you do not have permission to book for it');
    }
    
    // Get user's currency preference
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currency: true }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Verify the vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: bookingData.vendorId }
    });
    
    if (!vendor) {
      throw new Error('Vendor not found');
    }
    
    // Check if booking already exists for this event and vendor
    const existingBooking = await prisma.booking.findFirst({
      where: {
        eventId: bookingData.eventId,
        vendorId: bookingData.vendorId,
      }
    });
    
    if (existingBooking) {
      throw new Error('Booking already exists for this event and vendor');
    }
    
    // Calculate payment details using the payment calculation service with user's currency
    const paymentDetails = PaymentCalculationService.calculateBookingPaymentDetails(
      bookingData.amount,
      user.currency || 'NGN'
    );
    
    return await prisma.booking.create({
      data: {
        eventId: bookingData.eventId,
        vendorId: bookingData.vendorId,
        amount: paymentDetails.originalAmount, // Original amount before commissions
        currency: paymentDetails.originalCurrency, // User's currency
        customerTotal: paymentDetails.customerTotal, // Amount the customer pays (includes service fee)
        vendorNet: paymentDetails.vendorNet, // Amount vendor receives after commission
        ariyaRevenue: paymentDetails.ariyaRevenue, // Ariya's revenue from this booking
        notes: bookingData.notes,
        status: 'PENDING', // Default to pending
      },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            category: true,
          }
        },
        event: {
          select: {
            id: true,
            name: true,
            date: true,
          }
        }
      }
    });
  }

  // Update booking
  static async updateBooking(id: string, userId: string, updateData: UpdateBookingInput) {
    // Find the booking and verify user permission
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            userId: true
          }
        },
        vendor: {
          select: {
            userId: true
          }
        }
      }
    });
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    // Check if the user has permission to update this booking
    // Either they are the event owner or the vendor
    const isEventOwner = booking.event.userId === userId;
    const isVendor = booking.vendor.userId === userId;
    
    if (!isEventOwner && !isVendor) {
      throw new Error('You do not have permission to update this booking');
    }
    
    // If vendor is updating, they can only change status (not amount, etc.)
    if (isVendor && Object.keys(updateData).some(key => 
      !['status'].includes(key)
    )) {
      throw new Error('Vendors can only update booking status');
    }
    
    // Prevent updating commission-related fields directly
    const allowedFields = ['status', 'amount', 'notes', 'paymentStatus'];
    const invalidFields = Object.keys(updateData).filter(key => !allowedFields.includes(key));
    if (invalidFields.length > 0 && !isEventOwner) {  // Only event owner can update commission fields
      throw new Error(`Cannot update ${invalidFields.join(', ')} directly. These fields are calculated based on the original amount.`);
    }
    
    return await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
          }
        },
        event: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
  }

  // Delete booking
  static async deleteBooking(id: string, userId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            userId: true
          }
        }
      }
    });
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    // Only event owner can delete a booking
    if (booking.event.userId !== userId) {
      throw new Error('You do not have permission to delete this booking');
    }
    
    // Don't allow deletion if payment is already processed
    if (booking.paymentStatus === 'PAID') {
      throw new Error('Cannot delete a booking that has been paid');
    }
    
    return await prisma.booking.delete({
      where: { id }
    });
  }
}