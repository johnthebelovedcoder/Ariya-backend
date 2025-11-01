import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';

export abstract class BaseService {
  protected prisma = prisma;

  // Common error handling for services
  protected handleServiceError(error: any, context?: string) {
    // Log the error (in production, use a proper logger)
    console.error(`Service Error [${context || 'Unknown'}]:`, error);
    
    // Transform common database errors to application errors
    if (error.code === 'P2002') { // Unique constraint violation
      throw new AppError('A resource with this identifier already exists', 409);
    }
    
    if (error.code === 'P2025') { // Record not found
      throw new AppError('Resource not found', 404);
    }
    
    // For other errors, throw a generic service error
    throw new AppError(
      error.message || 'An error occurred in the service layer', 
      error.statusCode || 500
    );
  }

  // Common method to validate inputs before processing
  protected validateInputs<T>(data: T, requiredFields: string[]): T {
    for (const field of requiredFields) {
      if (!data || data[field as keyof T] === undefined || data[field as keyof T] === null || 
          (typeof data[field as keyof T] === 'string' && (data[field as keyof T] as string).trim() === '')) {
        throw new AppError(`Missing required field: ${field}`, 400);
      }
    }
    return data;
  }

  // Note: Prisma ORM already handles SQL injection prevention via parameterized queries.
  // Input validation should be done using schema validation libraries like Zod or Joi.
  // This method is kept for basic string trimming only.
  protected trimStrings<T>(data: T): T {
    if (typeof data === 'string') {
      return data.trim() as T;
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.trimStrings(item)) as T;
    }
    
    if (typeof data === 'object' && data !== null) {
      const trimmed: any = {};
      for (const [key, value] of Object.entries(data)) {
        trimmed[key] = this.trimStrings(value);
      }
      return trimmed as T;
    }
    
    return data;
  }
}