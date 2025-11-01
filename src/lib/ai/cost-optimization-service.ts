import prisma from '../prisma';
import { CostOptimizationRequest } from './types';

export class CostOptimizationService {
  // Get cost-saving recommendations
  static async getCostSavingTips(eventId: string, userId: string) {
    // Verify event ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId, userId }
    });
    
    if (!event) {
      throw new Error('Event not found or you do not have permission');
    }
    
    // Get budget information
    const budgets = await prisma.budget.findMany({
      where: { eventId }
    });
    
    const tips = [];
    
    // Analyze budget for potential savings
    for (const budget of budgets) {
      if (budget.allocated > 0) {
        if (budget.category.toLowerCase().includes('catering')) {
          tips.push({
            category: 'catering',
            tip: 'Consider buffet style instead of plated meals to reduce costs',
            potentialSavings: budget.allocated * 0.15, // 15% savings
            implementation: 'medium',
            impact: 'high'
          });
        } else if (budget.category.toLowerCase().includes('decoration')) {
          tips.push({
            category: 'decoration',
            tip: 'Use DIY decorations or rent instead of buying to save costs',
            potentialSavings: budget.allocated * 0.25, // 25% savings
            implementation: 'medium',
            impact: 'high'
          });
        } else if (budget.category.toLowerCase().includes('entertainment')) {
          tips.push({
            category: 'entertainment',
            tip: 'Consider local artists instead of high-profile entertainers',
            potentialSavings: budget.allocated * 0.30, // 30% savings
            implementation: 'easy',
            impact: 'high'
          });
        }
      }
    }
    
    // Add general tips
    tips.push({
      category: 'general',
      tip: 'Plan your event during off-peak seasons for reduced venue costs',
      potentialSavings: event.budget * 0.10, // 10% savings
      implementation: 'planning',
      impact: 'high'
    });
    
    tips.push({
      category: 'general', 
      tip: 'Send digital invitations instead of printed ones to save on printing costs',
      potentialSavings: 10000, // Fixed savings
      implementation: 'easy',
      impact: 'medium'
    });
    
    return {
      eventId,
      eventTitle: event.name,
      tips,
      currency: 'NGN',
      lastUpdated: new Date().toISOString(),
      confidence: 'medium'
    };
  }

  // Get optimization suggestions based on current plan
  static async getOptimizationSuggestions(request: CostOptimizationRequest, userId: string) {
    // Verify event ownership
    const event = await prisma.event.findUnique({
      where: { id: request.eventId, userId }
    });
    
    if (!event) {
      throw new Error('Event not found or you do not have permission');
    }
    
    // Calculate current allocation percentages
    const currentTotal = Object.values(request.currentBudgetAllocation).reduce((sum, val) => sum + val, 0);
    const currentPercentages = Object.entries(request.currentBudgetAllocation).reduce((acc, [cat, amount]) => {
      acc[cat] = (amount / currentTotal) * 100;
      return acc;
    }, {} as Record<string, number>);
    
    // Compare with recommended allocation for event type
    const eventType = event.type.toLowerCase();
    const allocationRules: Record<string, Record<string, number>> = {
      wedding: {
        venue: 35,
        catering: 30,
        attire: 10,
        photography: 10,
        entertainment: 8,
        decorations: 5,
        miscellaneous: 2
      },
      birthday: {
        venue: 20,
        catering: 40,
        entertainment: 20,
        decorations: 10,
        gifts: 5,
        miscellaneous: 5
      },
      corporate: {
        venue: 30,
        catering: 25,
        audio_visual: 20,
        materials: 10,
        entertainment: 10,
        miscellaneous: 5
      }
    };
    
    const recommendedAllocation = allocationRules[eventType] || allocationRules.birthday;
    
    const optimizations = [];
    
    // Identify categories that are over-allocated
    for (const [category, recommendedPct] of Object.entries(recommendedAllocation)) {
      const currentPct = currentPercentages[category] || 0;
      
      if (currentPct > recommendedPct * 1.2) { // 20% over recommended
        optimizations.push({
          category,
          issue: `Over-allocated: ${currentPct.toFixed(1)}% vs recommended ${recommendedPct}%`,
          suggestion: `Reduce allocation by ${(currentPct - recommendedPct).toFixed(1)}% to align with best practices`,
          potentialSavings: (currentPct - recommendedPct) / 100 * currentTotal,
          impact: 'cost_reduction',
          priority: 'high'
        });
      } else if (currentPct < recommendedPct * 0.8) { // 20% under recommended
        optimizations.push({
          category,
          issue: `Under-allocated: ${currentPct.toFixed(1)}% vs recommended ${recommendedPct}%`,
          suggestion: `Consider increasing allocation by ${(recommendedPct - currentPct).toFixed(1)}% to align with best practices`,
          impact: 'experience_enhancement',
          priority: 'medium'
        });
      }
    }
    
    return {
      eventId: request.eventId,
      eventType: eventType,
      currentAllocation: request.currentBudgetAllocation,
      recommendedAllocation,
      optimizations,
      currency: 'NGN',
      methodology: 'Comparison with industry best practices for event type',
      lastUpdated: new Date().toISOString()
    };
  }
}