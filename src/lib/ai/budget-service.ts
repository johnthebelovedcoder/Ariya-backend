import prisma from '../prisma';
import { BudgetEstimationRequest } from './types';

export class BudgetService {
  // Get AI budget estimate
  static async getBudgetEstimate(request: BudgetEstimationRequest) {
    // Calculate estimated costs for different categories
    const perGuestCost = request.guestCount > 50 ? 2000 : 3000; // Cost per guest varies with size
    const baseCost = request.guestCount * perGuestCost;
    
    // Adjust based on event type
    const typeMultipliers: Record<string, number> = {
      wedding: 1.5,
      birthday: 0.8,
      corporate: 1.2,
      anniversary: 1.0,
      graduation: 0.9
    };
    
    const typeMultiplier = typeMultipliers[request.eventType.toLowerCase()] || 1.0;
    const locationMultiplier = request.location?.toLowerCase().includes('lagos') ? 1.2 : 1.0; // Adjust for location cost
    
    const estimatedTotal = baseCost * typeMultiplier * locationMultiplier;
    
    // Breakdown by category
    const breakdown = {
      venue: estimatedTotal * 0.3,
      catering: estimatedTotal * 0.35,
      decorations: estimatedTotal * 0.15,
      entertainment: estimatedTotal * 0.1,
      miscellaneous: estimatedTotal * 0.1
    };
    
    return {
      eventType: request.eventType,
      guestCount: request.guestCount,
      estimatedTotal,
      breakdown,
      currency: 'NGN',
      location: request.location,
      confidence: 'medium',
      suggestions: [
        'Consider booking venue early to get better rates',
        'Catering costs can vary significantly based on menu selection',
        'Entertainment costs depend on the type of performers you choose'
      ]
    };
  }

  // Get AI budget allocation across categories
  static async getBudgetAllocation(budget: number, eventType: string) {
    // Suggested allocation based on event type
    const allocationRules: Record<string, Record<string, number>> = {
      wedding: {
        venue: 0.35,
        catering: 0.30,
        attire: 0.10,
        photography: 0.10,
        entertainment: 0.08,
        decorations: 0.05,
        miscellaneous: 0.02
      },
      birthday: {
        venue: 0.20,
        catering: 0.40,
        entertainment: 0.20,
        decorations: 0.10,
        gifts: 0.05,
        miscellaneous: 0.05
      },
      corporate: {
        venue: 0.30,
        catering: 0.25,
        audio_visual: 0.20,
        materials: 0.10,
        entertainment: 0.10,
        miscellaneous: 0.05
      }
    };
    
    const rule = allocationRules[eventType.toLowerCase()] || allocationRules.birthday;
    
    const allocation = Object.entries(rule).reduce((acc, [category, percentage]) => {
      acc[category] = {
        category,
        allocated: budget * percentage,
        percentage: percentage * 100,
        recommended: true
      };
      return acc;
    }, {} as Record<string, { category: string; allocated: number; percentage: number; recommended: boolean }>);

    return {
      totalBudget: budget,
      eventType,
      allocation,
      currency: 'NGN',
      lastUpdated: new Date().toISOString()
    };
  }

  // Recalculate allocation after manual adjustment
  static async reallocateBudget(currentAllocation: Record<string, number>, totalBudget: number) {
    const currentSum = Object.values(currentAllocation).reduce((sum, val) => sum + val, 0);
    
    if (Math.abs(currentSum - totalBudget) > 1) { // Allow small rounding errors
      // The allocations don't match total budget, need to adjust
      const adjustmentFactor = totalBudget / currentSum;
      const adjustedAllocation = Object.entries(currentAllocation).reduce((acc, [category, amount]) => {
        acc[category] = {
          category,
          allocated: amount * adjustmentFactor,
          percentage: ((amount * adjustmentFactor) / totalBudget) * 100,
          recommended: false // Mark as manually adjusted
        };
        return acc;
      }, {} as Record<string, { category: string; allocated: number; percentage: number; recommended: boolean }>);

      return {
        totalBudget,
        allocation: adjustedAllocation,
        currency: 'NGN',
        method: 'adjusted_proportionally',
        lastUpdated: new Date().toISOString()
      };
    }
    
    // If the allocations already sum to total budget, return as is
    const allocation = Object.entries(currentAllocation).reduce((acc, [category, amount]) => {
      acc[category] = {
        category,
        allocated: amount,
        percentage: (amount / totalBudget) * 100,
        recommended: false // Mark as manually adjusted
      };
      return acc;
    }, {} as Record<string, { category: string; allocated: number; percentage: number; recommended: boolean}>);
    
    return {
      totalBudget,
      allocation,
      currency: 'NGN',
      method: 'as_provided',
      lastUpdated: new Date().toISOString()
    };
  }

  // Get visual budget breakdown
  static async getVisualBudgetBreakdown(eventId: string, userId: string) {
    // Verify the event belongs to the user
    const event = await prisma.event.findUnique({
      where: { id: eventId, userId }
    });
    
    if (!event) {
      throw new Error('Event not found or you do not have permission to access it');
    }
    
    // Get existing budget allocations for the event
    const budgets = await prisma.budget.findMany({
      where: { eventId }
    });
    
    const totalAllocated = budgets.reduce((sum, budget) => sum + budget.allocated, 0);
    const totalActual = budgets.reduce((sum, budget) => sum + budget.actual, 0);
    const remaining = totalAllocated - totalActual;
    
    // Create visual breakdown data
    const breakdown = budgets.map(budget => ({
      category: budget.category,
      allocated: budget.allocated,
      actual: budget.actual,
      remaining: budget.allocated - budget.actual,
      percentage: totalAllocated > 0 ? (budget.allocated / totalAllocated) * 100 : 0,
      status: budget.actual > budget.allocated * 0.9 ? 'over-budget' : 'on-track'
    }));
    
    return {
      eventId,
      eventName: event.name,
      totalAllocated,
      totalActual,
      remaining,
      breakdown,
      currency: event.user?.currency || 'NGN',
      lastUpdated: new Date().toISOString()
    };
  }
}