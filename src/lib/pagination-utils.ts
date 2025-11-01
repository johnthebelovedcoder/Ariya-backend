import { z } from 'zod';

/**
 * Pagination query schema
 */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Parse pagination parameters from URL search params
 * Validates and applies defaults
 */
export function parsePagination(searchParams: URLSearchParams): PaginationQuery {
  const result = PaginationQuerySchema.parse({
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
  });
  
  return result;
}

/**
 * Calculate database offset from page and limit
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Create paginated response with metadata
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Validate pagination parameters manually
 * Useful when not using searchParams
 */
export function validatePagination(page?: number, limit?: number): PaginationQuery {
  return PaginationQuerySchema.parse({ page, limit });
}

/**
 * Get pagination info for SQL queries
 */
export function getPaginationParams(page: number, limit: number) {
  return {
    skip: calculateOffset(page, limit),
    take: limit
  };
}
