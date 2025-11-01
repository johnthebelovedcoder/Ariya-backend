// Validation Utility

export interface ValidationError {
  field: string;
  message: string;
}

export class ValidationUtil {
  static validateRequiredFields(
    obj: Record<string, any>, 
    requiredFields: string[]
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    
    for (const field of requiredFields) {
      const value = obj[field];
      if (value === undefined || value === null || 
          (typeof value === 'string' && value.trim() === '') ||
          (Array.isArray(value) && value.length === 0)) {
        errors.push({
          field,
          message: `${field} is required`
        });
      }
    }
    
    return errors;
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePositiveNumber(value: any, fieldName: string): ValidationError | null {
    if (typeof value !== 'number' || value <= 0) {
      return {
        field: fieldName,
        message: `${fieldName} must be a positive number`
      };
    }
    return null;
  }

  static validateString(value: any, fieldName: string, maxLength?: number): ValidationError | null {
    if (typeof value !== 'string') {
      return {
        field: fieldName,
        message: `${fieldName} must be a string`
      };
    }
    
    if (maxLength && value.length > maxLength) {
      return {
        field: fieldName,
        message: `${fieldName} exceeds maximum length of ${maxLength} characters`
      };
    }
    
    return null;
  }
}