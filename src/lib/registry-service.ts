import prisma from './prisma';
import { PaymentCalculationService } from './payment-calculation-service';

interface CreateRegistryInput {
  eventId: string;
  type: string;
  externalLinks: unknown; // This could be an array of link objects
  thankYouNotes?: unknown; // This could be a structured object for thank you notes
  premiumCustomization?: boolean; // Whether premium customization is enabled
}

interface UpdateRegistryInput {
  type?: string;
  externalLinks?: unknown;
  thankYouNotes?: unknown;
  premiumCustomizationFeePaid?: boolean; // Track if premium customization fee was paid
}

export class RegistryService {
  // Get registry by event ID
  static async getRegistryByEventId(eventId: string, userId: string) {
    const registry = await prisma.registry.findUnique({
      where: { eventId },
      include: {
        event: {
          select: {
            userId: true
          }
        }
      }
    });
    
    if (!registry) {
      return null;
    }
    
    // Check if the user has permission to access this registry
    // The user must be the event owner
    if (registry.event.userId !== userId) {
      return null;
    }
    
    return registry;
  }

  // Create a new registry
  static async createRegistry(registryData: CreateRegistryInput, userId: string) {
    // Verify the event belongs to the user
    const event = await prisma.event.findUnique({
      where: { id: registryData.eventId, userId }
    });
    
    if (!event) {
      throw new Error('Event not found or you do not have permission to create a registry for it');
    }
    
    // Check if registry already exists for this event
    const existingRegistry = await prisma.registry.findUnique({
      where: { eventId: registryData.eventId }
    });
    
    if (existingRegistry) {
      throw new Error('Registry already exists for this event');
    }
    
    return await prisma.registry.create({
      data: {
        eventId: registryData.eventId,
        type: registryData.type,
        externalLinks: registryData.externalLinks,
        thankYouNotes: registryData.thankYouNotes,
        premiumCustomization: registryData.premiumCustomization || false,
        premiumCustomizationFeePaid: registryData.premiumCustomization ? false : undefined, // Only track if customization is enabled
      }
    });
  }

  // Update registry
  static async updateRegistry(eventId: string, userId: string, updateData: UpdateRegistryInput) {
    const registry = await prisma.registry.findUnique({
      where: { eventId },
      include: {
        event: {
          select: {
            userId: true
          }
        }
      }
    });
    
    if (!registry) {
      throw new Error('Registry not found');
    }
    
    // Check if the user has permission to update this registry
    // The user must be the event owner
    if (registry.event.userId !== userId) {
      throw new Error('You do not have permission to update this registry');
    }
    
    // If premium customization is being enabled, calculate the fee
    if (updateData.premiumCustomization && !registry.premiumCustomization) {
      // The premium customization fee is ₦2,000 per the pricing model
      updateData.premiumCustomizationFeePaid = false; // Need to collect payment separately
    }
    
    return await prisma.registry.update({
      where: { eventId },
      data: updateData
    });
  }

  // Delete registry
  static async deleteRegistry(eventId: string, userId: string) {
    const registry = await prisma.registry.findUnique({
      where: { eventId },
      include: {
        event: {
          select: {
            userId: true
          }
        }
      }
    });
    
    if (!registry) {
      throw new Error('Registry not found');
    }
    
    // Only event owner can delete a registry
    if (registry.event.userId !== userId) {
      throw new Error('You do not have permission to delete this registry');
    }
    
    return await prisma.registry.delete({
      where: { eventId }
    });
  }

  // Add an external link to registry
  static async addExternalLink(eventId: string, userId: string, link: unknown) {
    const registry = await prisma.registry.findUnique({
      where: { eventId },
      include: {
        event: {
          select: {
            userId: true
          }
        }
      }
    });
    
    if (!registry) {
      throw new Error('Registry not found');
    }
    
    // Check if the user has permission to update this registry
    if (registry.event.userId !== userId) {
      throw new Error('You do not have permission to update this registry');
    }
    
    const updatedExternalLinks = Array.isArray(registry.externalLinks) 
      ? [...registry.externalLinks, link] 
      : [link];
    
    return await prisma.registry.update({
      where: { eventId },
      data: {
        externalLinks: updatedExternalLinks
      }
    });
  }

  // Remove an external link from registry
  static async removeExternalLink(eventId: string, userId: string, linkIndex: number) {
    const registry = await prisma.registry.findUnique({
      where: { eventId },
      include: {
        event: {
          select: {
            userId: true
          }
        }
      }
    });
    
    if (!registry) {
      throw new Error('Registry not found');
    }
    
    // Check if the user has permission to update this registry
    if (registry.event.userId !== userId) {
      throw new Error('You do not have permission to update this registry');
    }
    
    if (!Array.isArray(registry.externalLinks) || linkIndex < 0 || linkIndex >= registry.externalLinks.length) {
      throw new Error('Invalid link index');
    }
    
    const updatedExternalLinks = [...registry.externalLinks];
    updatedExternalLinks.splice(linkIndex, 1);
    
    return await prisma.registry.update({
      where: { eventId },
      data: {
        externalLinks: updatedExternalLinks
      }
    });
  }

  // Calculate registry purchase fees
  static calculateRegistryItemFees(itemAmount: number): { total: number, fee: number } {
    // According to pricing model: 3-5% per item
    // Using 4% as a middle ground
    const feePercent = 0.04;
    const fee = itemAmount * feePercent;
    const total = itemAmount + fee;
    
    return { total, fee };
  }

  // Calculate premium customization fee
  static calculatePremiumCustomizationFee(): number {
    // According to pricing model: ₦2,000 flat fee
    return 2000;
  }

  // Process registry purchase payment
  static async processRegistryPurchase(itemAmount: number, eventId: string, userId: string) {
    // Verify the event belongs to the user
    const event = await prisma.event.findUnique({
      where: { id: eventId, userId }
    });
    
    if (!event) {
      throw new Error('Event not found or you do not have permission for this event');
    }
    
    // Calculate fees using the payment calculation service
    const paymentDetails = PaymentCalculationService.calculateRegistryPaymentDetails(itemAmount);
    
    // In a real application, you would create a payment record
    // For now, we'll return the calculated amounts
    return {
      originalAmount: itemAmount,
      total: paymentDetails.customerTotal,
      fee: paymentDetails.ariyaRevenue,
      breakdown: paymentDetails
    };
  }

  // Process cash gift conversion payment
  static async processCashGiftConversion(amount: number, eventId: string, userId: string) {
    // Verify the event belongs to the user
    const event = await prisma.event.findUnique({
      where: { id: eventId, userId }
    });
    
    if (!event) {
      throw new Error('Event not found or you do not have permission for this event');
    }
    
    // Calculate fees for cash gift conversion (4% as per pricing model)
    const paymentDetails = PaymentCalculationService.calculateCashGiftConversionDetails(amount);
    
    // In a real application, you would create a payment record
    // For now, we'll return the calculated amounts
    return {
      originalAmount: amount,
      total: paymentDetails.customerTotal,
      fee: paymentDetails.ariyaRevenue,
      breakdown: paymentDetails
    };
  }
}