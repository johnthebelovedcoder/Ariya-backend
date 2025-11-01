// Pagination Utility

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class PaginationUtil {
  static validateParams(page: number, limit: number): void {
    if (page < 1 || limit < 1) {
      throw new Error('Page and limit must be positive numbers');
    }
    
    if (limit > 100) {
      throw new Error('Limit cannot exceed 100');
    }
  }

  static calculateSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  static calculatePagination<T>(
    page: number,
    limit: number, 
    total: number, 
    data: T[]
  ): PaginatedResult<T> {
    const pages = Math.ceil(total / limit);
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    };
  }
}