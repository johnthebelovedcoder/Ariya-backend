import prisma from '../../prisma';

export class AdminAIAnalyticsService {
  // Get AI feature usage metrics
  static async getAIUsageMetrics() {
    // Count AI recommendations
    const totalRecommendations = await prisma.aIRecommendation.count();
    
    // In a real system, you'd track specific AI feature usage in a separate table
    // For now, we'll return placeholder data based on recommendation count
    return {
      totalRecommendationsGenerated: totalRecommendations,
      aiFeatureUsage: {
        eventIdeas: Math.floor(totalRecommendations * 0.3), // 30% of total
        budgetEstimation: Math.floor(totalRecommendations * 0.25), // 25% of total
        vendorRecommendations: Math.floor(totalRecommendations * 0.35), // 35% of total
        costOptimization: Math.floor(totalRecommendations * 0.1), // 10% of total
      },
      growthTrend: 'positive',
      mostUsedFeatures: ['vendorRecommendations', 'eventIdeas']
    };
  }
}