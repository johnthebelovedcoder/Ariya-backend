import prisma from './prisma';
import { Booking, BookingStatus } from '@prisma/client';

interface CreateInquiryInput {
  vendorId: string;
  message: string;
  eventDetails?: string;
  budgetRange?: string; // Low, Medium, High or specific amount range
  eventDate?: Date;
  requiredServices?: string[];
}

interface UpdateInquiryInput {
  message?: string;
  status?: string; // INQUIRY_STATUS: PENDING, QUOTED, ACCEPTED, REJECTED, EXPIRED
  quoteAmount?: number;
  quoteDetails?: string;
}

export class InquiryService {
  // Create a new inquiry to a vendor
  static async createInquiry(inquiryData: CreateInquiryInput, userId: string) {
    // Verify vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: inquiryData.vendorId },
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

    // Create inquiry as a booking with PENDING status and special type
    // We'll use the existing Booking model for now, treating inquiries as bookings in PENDING state
    const inquiry = await prisma.booking.create({
      data: {
        eventId: inquiryData.eventDetails || 'inquiry', // Use event details as placeholder for inquiry
        vendorId: inquiryData.vendorId,
        status: 'PENDING' as BookingStatus, // Inquiry starts as pending
        amount: 0, // No amount for inquiry initially
        currency: 'NGN', // Default currency
        customerTotal: 0,
        vendorNet: 0,
        ariyaRevenue: 0,
        paymentStatus: 'PENDING',
        notes: `INQUIRY: ${inquiryData.message}\nBudget: ${inquiryData.budgetRange || 'Not specified'}\nEvent date: ${inquiryData.eventDate ? inquiryData.eventDate.toString() : 'Not specified'}\nServices: ${inquiryData.requiredServices?.join(', ') || 'Not specified'}`,
      },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            category: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    return inquiry;
  }

  // Get inquiries for a specific user (as requester)
  static async getUserInquiries(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    // For now, get bookings that were created by this user's events that are in PENDING status
    const [inquiries, total] = await Promise.all([
      prisma.booking.findMany({
        where: {
          event: {
            userId: userId
          }
        },
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
              category: true,
              ratingAverage: true,
              location: true,
            }
          },
          event: {
            select: {
              id: true,
              name: true,
              date: true,
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.count({
        where: {
          event: {
            userId: userId
          }
        }
      })
    ]);

    return {
      inquiries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  // Get inquiries for a vendor (requests from potential customers)
  static async getVendorInquiries(vendorId: string, userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    // Verify the vendor belongs to the user
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId, userId }
    });
    
    if (!vendor) {
      throw new Error('Vendor not found or you do not have permission');
    }
    
    const [inquiries, total] = await Promise.all([
      prisma.booking.findMany({
        where: {
          vendorId: vendorId,
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
              userId: true, // This is the user who made the inquiry
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profileImage: true,
                }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.count({
        where: { vendorId: vendorId }
      })
    ]);

    return {
      inquiries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  // Get specific inquiry by ID
  static async getInquiryById(id: string, userId: string) {
    const inquiry = await prisma.booking.findUnique({
      where: { id },
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
            userId: true, // The user who made the inquiry
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      }
    });

    if (!inquiry) {
      return null;
    }

    // Check if user is either the event owner (inquiry sender) or vendor owner
    const isEventOwner = inquiry.event.userId === userId;
    const isVendorOwner = inquiry.vendor.userId === userId;
    
    if (!isEventOwner && !isVendorOwner) {
      return null;
    }

    return inquiry;
  }

  // Vendor responds to inquiry with a quote
  static async respondToInquiry(id: string, vendorUserId: string, quoteAmount: number, quoteDetails: string) {
    // Find the inquiry and verify vendor permission
    const inquiry = await prisma.booking.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!inquiry) {
      throw new Error('Inquiry not found');
    }

    if (inquiry.vendor.userId !== vendorUserId) {
      throw new Error('You do not have permission to respond to this inquiry');
    }

    // Update the inquiry with quote information
    // We'll update the amount to the quoted amount and add quote details to notes
    const updatedInquiry = await prisma.booking.update({
      where: { id },
      data: {
        amount: quoteAmount,
        notes: `${inquiry.notes}\n\nVENDOR QUOTE: ${quoteDetails}`,
      },
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

    return updatedInquiry;
  }

  // Update inquiry status (by either party)
  static async updateInquiryStatus(id: string, userId: string, status: string) {
    // Find the inquiry and verify permission
    const inquiry = await prisma.booking.findUnique({
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

    if (!inquiry) {
      throw new Error('Inquiry not found');
    }

    // Check if user is either event owner or vendor owner
    const isEventOwner = inquiry.event.userId === userId;
    const isVendorOwner = inquiry.vendor.userId === userId;
    
    if (!isEventOwner && !isVendorOwner) {
      throw new Error('You do not have permission to update this inquiry');
    }

    // Update the booking status - we'll treat specific statuses differently
    const updatedInquiry = await prisma.booking.update({
      where: { id },
      data: {
        // For now, we'll map inquiry statuses to booking statuses where possible
        // PENDING: Initial inquiry
        // Other statuses might need custom handling
        status: status === 'ACCEPTED' ? 'CONFIRMED' as BookingStatus : 
                status === 'CANCELLED' || status === 'REJECTED' ? 'CANCELLED' as BookingStatus : 
                'PENDING' as BookingStatus
      },
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

    return updatedInquiry;
  }

  // Convert inquiry to booking
  static async convertInquiryToBooking(inquiryId: string, userId: string) {
    const inquiry = await prisma.booking.findUnique({
      where: { id: inquiryId },
      include: {
        event: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!inquiry) {
      throw new Error('Inquiry not found');
    }

    // Only event owner can convert inquiry to booking
    if (inquiry.event.userId !== userId) {
      throw new Error('You do not have permission to convert this inquiry to booking');
    }

    // The inquiry is already a booking, so we'll update its status to confirmed
    // This effectively converts the inquiry to an accepted booking
    return await prisma.booking.update({
      where: { id: inquiryId },
      data: {
        status: 'CONFIRMED' as BookingStatus,
        // Add to the notes that this was converted from an inquiry
        notes: `${inquiry.notes}\n\nConverted from inquiry to confirmed booking`
      }
    });
  }
}