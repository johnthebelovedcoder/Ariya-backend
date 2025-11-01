// src/lib/database-router.ts
import prisma from './prisma';

export class DatabaseRouter {
  private primaryDb: any; // Using any for now since PrismaClient type can be complex
  private replicaDbs: Map<string, any>;
  
  constructor() {
    this.primaryDb = prisma; // Your existing primary
    this.replicaDbs = new Map();
    
    // Initialize regional replicas - for now using the same primary for all regions
    // In production, you would have separate database instances
    this.setupReplicas();
  }
  
  private setupReplicas() {
    // For this implementation, we'll use the same primary instance
    // In a real multi-region setup, these would be different database instances
    const regions = ['US', 'EU', 'APAC', 'AFRICA'];
    regions.forEach(region => {
      // In a real implementation, you would create different Prisma clients for each region
      this.replicaDbs.set(region, prisma);
    });
  }
  
  getReadDatabase(countryCode: string): any {
    const region = this.mapCountryToRegion(countryCode);
    const db = this.replicaDbs.get(region);
    return db || this.primaryDb;
  }
  
  getWriteDatabase(): any {
    return this.primaryDb; // Always use primary for writes to maintain consistency
  }
  
  private mapCountryToRegion(countryCode: string): string {
    const regionMap: Record<string, string> = {
      'US': 'US', 'CA': 'US', 'MX': 'US',
      'GB': 'EU', 'DE': 'EU', 'FR': 'EU', 'NG': 'AFRICA', 'GH': 'AFRICA', 'KE': 'AFRICA',
      'JP': 'APAC', 'CN': 'APAC', 'IN': 'APAC', 'AU': 'APAC', 'SG': 'APAC'
    };
    return regionMap[countryCode] || 'US';
  }
  
  // Method to get a database instance for a specific operation
  getDatabaseForOperation(operation: 'read' | 'write', countryCode: string): any {
    if (operation === 'write') {
      return this.getWriteDatabase();
    }
    return this.getReadDatabase(countryCode);
  }
}