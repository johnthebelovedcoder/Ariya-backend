import { 
  EventIdeaService, 
  BudgetService, 
  VendorRecommendationService, 
  CostOptimizationService, 
  FeedbackService 
} from './ai';

export class EnhancedAIService {
  // Generate event ideas based on user input
  static async generateEventIdeas(request: any) {
    return EventIdeaService.generateEventIdeas(request);
  }

  // Get theme suggestions for event type
  static async getEventThemes(eventType: string) {
    return EventIdeaService.getEventThemes(eventType);
  }

  // Get AI budget estimate
  static async getBudgetEstimate(request: any) {
    return BudgetService.getBudgetEstimate(request);
  }

  // Get AI budget allocation across categories
  static async getBudgetAllocation(budget: number, eventType: string) {
    return BudgetService.getBudgetAllocation(budget, eventType);
  }

  // Recalculate allocation after manual adjustment
  static async reallocateBudget(currentAllocation: Record<string, number>, totalBudget: number) {
    return BudgetService.reallocateBudget(currentAllocation, totalBudget);
  }

  // Get visual budget breakdown
  static async getVisualBudgetBreakdown(eventId: string, userId: string) {
    return BudgetService.getVisualBudgetBreakdown(eventId, userId);
  }

  // Get AI-recommended vendors by category/budget
  static async getRecommendedVendors(request: any, userId: string) {
    return VendorRecommendationService.getRecommendedVendors(request, userId);
  }

  // Get alternative vendor suggestions
  static async getAlternativeVendors(vendorId: string) {
    return VendorRecommendationService.getAlternativeVendors(vendorId);
  }

  // Get cost-saving recommendations
  static async getCostSavingTips(eventId: string, userId: string) {
    return CostOptimizationService.getCostSavingTips(eventId, userId);
  }

  // Get optimization suggestions based on current plan
  static async getOptimizationSuggestions(request: any, userId: string) {
    return CostOptimizationService.getOptimizationSuggestions(request, userId);
  }

  // Submit feedback on AI recommendations
  static async submitAIFeedback(feedbackData: any) {
    return FeedbackService.submitAIFeedback(feedbackData);
  }
}