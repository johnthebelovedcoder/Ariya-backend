// Filtering and Search Utility
import { Prisma } from '@prisma/client';

export class FilterUtil {
  // Create case-insensitive search condition
  static createSearchCondition(field: string, searchValue: string): Prisma.UserWhereInput {
    if (!searchValue) return {};
    
    return {
      [field]: {
        contains: searchValue,
        mode: 'insensitive' as Prisma.QueryMode
      }
    };
  }

  // Create OR condition for multiple field search
  static createMultiFieldSearch(conditions: Array<{ field: string; value: string }>): Prisma.UserWhereInput {
    if (!conditions || conditions.length === 0) return {};
    
    const orConditions = conditions
      .filter(condition => condition.value)
      .map(condition => ({
        [condition.field]: {
          contains: condition.value,
          mode: 'insensitive' as Prisma.QueryMode
        }
      }));
    
    return orConditions.length > 0 ? { OR: orConditions } : {};
  }

  // Create range condition
  static createRangeCondition(
    field: string, 
    min?: number, 
    max?: number
  ): Prisma.UserWhereInput {
    const condition: any = {};
    
    if (min !== undefined || max !== undefined) {
      condition[field] = {};
      
      if (min !== undefined) {
        condition[field].gte = min;
      }
      
      if (max !== undefined) {
        condition[field].lte = max;
      }
    }
    
    return condition;
  }

  // Create exact match condition
  static createExactMatchCondition(field: string, value: any): Prisma.UserWhereInput {
    if (value === undefined || value === null) return {};
    
    return { [field]: value };
  }
}