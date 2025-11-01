import prisma from './prisma';

interface CreateAIRecommendationInput {
  eventId: string;
  recommendations: any; // This could be a more specific type based on what the AI returns
  feedback?: string;
}

interface UpdateAIRecommendationInput {
  recommendations?: any;
  feedback?: string;
}

export class AIRecommendationService {
  // Get AI recommendations for an event
  static async getEventRecommendations(
    eventId: string,
    userId: string
  ) {
    // First verify the event belongs to the user
    const event = await prisma.event.findUnique({
      where: { id: eventId, userId }
    });
    
    if (!event) {
      throw new Error('Event not found or you do not have permission to access it');
    }
    
    return await prisma.aIRecommendation.findMany({
      where: { eventId },
      select: {
        id: true,
        recommendations: true,
        feedback: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get AI recommendation by ID
  static async getRecommendationById(id: string, userId: string) {
    const recommendation = await prisma.aIRecommendation.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            userId: true
          }
        }
      }
    });
    
    if (!recommendation) {
      return null;
    }
    
    // Check if the user has permission to access this recommendation
    // The user must be the event owner
    if (recommendation.event.userId !== userId) {
      return null;
    }
    
    // Return recommendation without event reference to avoid circular reference
    const { event: _, ...recommendationData } = recommendation;
    
    return {
      id: recommendationData.id,
      eventId: recommendationData.eventId,
      recommendations: recommendationData.recommendations,
      feedback: recommendationData.feedback,
      createdAt: recommendationData.createdAt,
      updatedAt: recommendationData.updatedAt,
    };
  }

  // Create new AI recommendations for an event
  static async createRecommendations(recommendationData: CreateAIRecommendationInput, userId: string) {
    // Verify the event belongs to the user
    const event = await prisma.event.findUnique({
      where: { id: recommendationData.eventId, userId }
    });
    
    if (!event) {
      throw new Error('Event not found or you do not have permission to add recommendations to it');
    }
    
    return await prisma.aIRecommendation.create({
      data: {
        eventId: recommendationData.eventId,
        recommendations: recommendationData.recommendations,
        feedback: recommendationData.feedback,
      },
      select: {
        id: true,
        recommendations: true,
        feedback: true,
        createdAt: true,
      }
    });
  }

  // Update AI recommendation
  static async updateRecommendation(id: string, userId: string, updateData: UpdateAIRecommendationInput) {
    const recommendation = await prisma.aIRecommendation.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            userId: true
          }
        }
      }
    });
    
    if (!recommendation) {
      throw new Error('Recommendation not found');
    }
    
    // Check if the user has permission to update this recommendation
    // The user must be the event owner
    if (recommendation.event.userId !== userId) {
      throw new Error('You do not have permission to update this recommendation');
    }
    
    return await prisma.aIRecommendation.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        recommendations: true,
        feedback: true,
        updatedAt: true,
      }
    });
  }

  // Delete AI recommendation
  static async deleteRecommendation(id: string, userId: string) {
    const recommendation = await prisma.aIRecommendation.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            userId: true
          }
        }
      }
    });
    
    if (!recommendation) {
      throw new Error('Recommendation not found');
    }
    
    // Only event owner can delete a recommendation
    if (recommendation.event.userId !== userId) {
      throw new Error('You do not have permission to delete this recommendation');
    }
    
    return await prisma.aIRecommendation.delete({
      where: { id }
    });
  }

  // Generate AI recommendations based on event details
  static async generateRecommendationsForEvent(eventId: string, userId: string) {
    // First verify the event belongs to the user
    const event = await prisma.event.findUnique({
      where: { id: eventId, userId },
      include: {
        guests: {
          select: {
            dietaryRestrictions: true,
          }
        },
        bookings: {
          select: {
            vendor: {
              select: {
                category: true,
                businessName: true,
              }
            }
          }
        }
      }
    });
    
    if (!event) {
      throw new Error('Event not found or you do not have permission to generate recommendations for it');
    }
    
    // This is a simplified example of what an AI recommendation might look like
    // In a real application, this would call an actual AI service
    const recommendations = {
      vendors: [
        {
          category: "Catering",
          suggestions: ["Local Caterer A", "Gourmet Bistro", "Organic Eats"],
          reason: "Based on event size and dietary restrictions in your guest list"
        },
        {
          category: "Entertainment",
          suggestions: ["DJ Services", "Live Band", "Photo Booth"],
          reason: "Popular options for events of this type"
        }
      ],
      themes: [
        event.theme || "Classic",
        "Modern",
        "Rustic",
        "Bohemian"
      ],
      timeline: {
        "2_months_before": ["Finalize venue", "Send save-the-dates"],
        "1_month_before": ["Finalize catering", "Confirm guest count"],
        "1_week_before": ["Final walkthrough", "Confirm delivery details"]
      },
      budget_tips: [
        "Consider allocating 40-50% of budget to catering",
        "Set aside 10% for unexpected expenses"
      ]
    };
    
    // Create or update the recommendations
    let aiRecommendation = await prisma.aIRecommendation.findFirst({
      where: { eventId }
    });
    
    if (aiRecommendation) {
      // Update existing recommendation
      aiRecommendation = await prisma.aIRecommendation.update({
        where: { id: aiRecommendation.id },
        data: { 
          recommendations: recommendations,
          feedback: "Auto-generated based on event details"
        }
      });
    } else {
      // Create new recommendation
      aiRecommendation = await prisma.aIRecommendation.create({
        data: {
          eventId,
          recommendations: recommendations,
          feedback: "Auto-generated based on event details"
        }
      });
    }
    
    return {
      id: aiRecommendation.id,
      recommendations: aiRecommendation.recommendations,
      feedback: aiRecommendation.feedback,
      createdAt: aiRecommendation.createdAt,
      updatedAt: aiRecommendation.updatedAt,
    };
  }
}