import validator from 'validator';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  type?: 'email' | 'password' | 'string' | 'number';
  pattern?: RegExp;
  customValidator?: (value: any) => boolean | string;
}

export const validateInput = (input: any, rules: { [key: string]: ValidationRule }): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  for (const [field, rule] of Object.entries(rules)) {
    const value = input[field];
    
    // Check if field is required
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }
    
    // Skip validation for undefined/null values if not required
    if (value === undefined || value === null) {
      continue;
    }
    
    // Validate minimum length
    if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
      errors.push(`${field} requires minimum length of ${rule.minLength}`);
    }
    
    // Validate maximum length
    if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
      errors.push(`${field} exceeds maximum length of ${rule.maxLength}`);
    }
    
    // Validate type
    if (rule.type === 'email' && !validator.isEmail(value)) {
      errors.push(`Invalid email format for ${field}`);
    }
    
    if (rule.type === 'password' && typeof value === 'string') {
      // Check if password meets security requirements
      if (value.length < 8) {
        errors.push(`Password must be at least 8 characters long`);
      }
      
      if (!/(?=.*[a-z])/.test(value)) {
        errors.push(`Password must contain at least one lowercase letter`);
      }
      
      if (!/(?=.*[A-Z])/.test(value)) {
        errors.push(`Password must contain at least one uppercase letter`);
      }
      
      if (!/(?=.*\d)/.test(value)) {
        errors.push(`Password must contain at least one number`);
      }
      
      if (!/(?=.*[@$!%*?&])/.test(value)) {
        errors.push(`Password must contain at least one special character (@$!%*?&)`);
      }
    }
    
    // Validate with custom validator if provided
    if (rule.customValidator) {
      const result = rule.customValidator(value);
      if (result !== true) {
        const errorMessage = typeof result === 'string' ? result : `${field} is invalid`;
        errors.push(errorMessage);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    // Remove script tags and other potentially dangerous content
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item));
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
};

// Specific validation functions
export const isValidEmail = (email: string): boolean => {
  return validator.isEmail(email);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 8 && 
         /(?=.*[a-z])/.test(password) &&
         /(?=.*[A-Z])/.test(password) &&
         /(?=.*\\d)/.test(password) &&
         /(?=.*[@$!%*?&])/.test(password);
};

export const isValidUrl = (url: string): boolean => {
  return validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_valid_protocol: true
  });
};

export const validateFileUpload = (file: any, options?: { allowedTypes?: string[]; maxSize?: number }) => {
  const allowedTypes = options?.allowedTypes || ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  const maxSize = options?.maxSize || 5 * 1024 * 1024; // 5MB by default
  
  if (!file) {
    throw new Error('No file provided');
  }
  
  if (typeof file === 'object') {
    if (file.type && !allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only images and PDFs are allowed.');
    }
    
    if (file.size && file.size > maxSize) {
      throw new Error('File size exceeds 5MB limit');
    }
    
    // Validate file extension by looking at the name
    if (file.name) {
      const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
      const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      
      if (!validExtensions.includes(fileExtension)) {
        throw new Error('Invalid file extension');
      }
    }
  }
  
  return true;
};