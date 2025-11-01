// AI Service Types

export interface EventIdeaRequest {
  eventType?: string;
  guestCount?: number;
  budget?: number;
  location?: string;
  theme?: string;
  interests?: string[];
}

export interface BudgetEstimationRequest {
  eventType: string;
  guestCount: number;
  location?: string;
  specialRequirements?: string[];
}

export interface VendorRecommendationRequest {
  category: string;
  budgetRange: number;
  location?: string;
  eventDate?: Date;
  requiredServices?: string[];
  minRating?: number;
}

export interface CostOptimizationRequest {
  eventId: string;
  currentBudgetAllocation: Record<string, number>;
}