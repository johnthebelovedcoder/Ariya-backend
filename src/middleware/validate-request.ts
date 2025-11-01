import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createApiError } from '@/lib/api-utils';
import Logger from '@/lib/logger-service';

/**
 * Validate request data using Zod schema
 * Supports both body and query parameter validation
 */
export async function validateRequest<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>,
  source: 'body' | 'query' = 'body'
): Promise<T> {
  try {
    let data: unknown;
    
    if (source === 'body') {
      data = await request.json();
    } else {
      const { searchParams } = new URL(request.url);
      data = Object.fromEntries(searchParams.entries());
    }
    
    const result = schema.safeParse(data);
    
    if (!result.success) {
      Logger.warn('Request validation failed', {
        errors: result.error.issues,
        source,
        data: JSON.stringify(data).substring(0, 200)
      });
      
      throw createApiError('Validation failed', 400, result.error.issues);
    }
    
    return result.data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      Logger.warn('Invalid JSON in request body');
      throw createApiError('Invalid JSON in request body', 400);
    }
    throw error;
  }
}

/**
 * Validate request body with Zod schema
 * Convenience wrapper for body validation
 */
export async function validateBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<T> {
  return validateRequest(request, schema, 'body');
}

/**
 * Validate query parameters with Zod schema
 * Convenience wrapper for query validation
 */
export async function validateQuery<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<T> {
  return validateRequest(request, schema, 'query');
}
