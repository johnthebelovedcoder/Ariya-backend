import { createApiResponse } from './api-utils';
import { PaginatedResponse } from './pagination-utils';

/**
 * Standardized response builder for consistent API responses
 */
export class ResponseBuilder {
  /**
   * Success response (200)
   */
  static success<T>(data: T, message = 'Success') {
    return createApiResponse(data, message, 200);
  }
  
  /**
   * Created response (201)
   */
  static created<T>(data: T, message = 'Resource created successfully') {
    return createApiResponse(data, message, 201);
  }
  
  /**
   * No content response (204)
   */
  static noContent(message = 'Operation completed successfully') {
    return createApiResponse(null, message, 204);
  }
  
  /**
   * Paginated response (200)
   */
  static paginated<T>(
    response: PaginatedResponse<T>,
    message = 'Resources retrieved successfully'
  ) {
    return createApiResponse(response, message, 200);
  }
  
  /**
   * Accepted response (202)
   * For async operations
   */
  static accepted<T>(data: T, message = 'Request accepted for processing') {
    return createApiResponse(data, message, 202);
  }
}
