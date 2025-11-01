import { CreateUserRequest, UpdateUserRequest, CreateEventRequest, CreateBookingRequest } from '../types/api';
import { validateInput } from './validation';

// User DTO validators
export const validateCreateUserRequest = (data: CreateUserRequest): { isValid: boolean; errors: string[] } => {
  const rules = {
    name: { 
      required: true, 
      minLength: 2, 
      maxLength: 100,
      customValidator: (value: any) => {
        if (typeof value !== 'string') return 'Name must be a string';
        return true;
      }
    },
    email: { 
      required: true, 
      type: 'email',
      maxLength: 255
    },
    password: { 
      required: true, 
      type: 'password',
      minLength: 8
    },
    role: {
      customValidator: (value: any) => {
        if (value === undefined) return true; // Optional field
        if (typeof value !== 'string') return 'Role must be a string';
        const validRoles = ['PLANNER', 'VENDOR', 'ADMIN', 'USER'];
        if (!validRoles.includes(value.toUpperCase())) {
          return `Role must be one of: ${validRoles.join(', ')}`;
        }
        return true;
      }
    },
    profileImage: {
      customValidator: (value: any) => {
        if (value === undefined) return true; // Optional field
        if (typeof value !== 'string') return 'Profile image must be a URL string';
        if (value.length > 500) return 'Profile image URL is too long';
        return true;
      }
    },
    phone: {
      customValidator: (value: any) => {
        if (value === undefined) return true; // Optional field
        if (value && typeof value !== 'string') return 'Phone must be a string';
        if (value && value.length > 20) return 'Phone number is too long';
        return true;
      }
    }
  };

  return validateInput(data, rules);
};

export const validateUpdateUserRequest = (data: UpdateUserRequest): { isValid: boolean; errors: string[] } => {
  const rules = {
    name: { 
      customValidator: (value: any) => {
        if (value === undefined) return true; // Optional field
        if (typeof value !== 'string') return 'Name must be a string';
        if (value.trim().length < 2) return 'Name must be at least 2 characters long';
        if (value.length > 100) return 'Name is too long';
        return true;
      }
    },
    email: { 
      customValidator: (value: any) => {
        if (value === undefined) return true; // Optional field
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
        if (value && value.length > 255) return 'Email is too long';
        return true;
      }
    },
    password: { 
      customValidator: (value: any) => {
        if (value === undefined) return true; // Optional field
        if (typeof value !== 'string') return 'Password must be a string';
        if (value.length < 8) return 'Password must be at least 8 characters long';
        return true;
      }
    },
    profileImage: {
      customValidator: (value: any) => {
        if (value === undefined) return true; // Optional field
        if (typeof value !== 'string') return 'Profile image must be a URL string';
        if (value.length > 500) return 'Profile image URL is too long';
        return true;
      }
    },
    phone: {
      customValidator: (value: any) => {
        if (value === undefined) return true; // Optional field
        if (value && typeof value !== 'string') return 'Phone must be a string';
        if (value && value.length > 20) return 'Phone number is too long';
        return true;
      }
    }
  };

  return validateInput(data, rules);
};

// Event DTO validators
export const validateCreateEventRequest = (data: CreateEventRequest): { isValid: boolean; errors: string[] } => {
  const rules = {
    name: { 
      required: true, 
      minLength: 2, 
      maxLength: 200,
      customValidator: (value: any) => {
        if (typeof value !== 'string') return 'Event name must be a string';
        return true;
      }
    },
    type: { 
      required: true, 
      minLength: 2, 
      maxLength: 100,
      customValidator: (value: any) => {
        if (typeof value !== 'string') return 'Event type must be a string';
        // Add more specific validation for event types if needed
        return true;
      }
    },
    date: { 
      required: true, 
      customValidator: (value: any) => {
        if (typeof value !== 'string') return 'Event date must be an ISO string';
        const date = new Date(value);
        if (isNaN(date.getTime())) return 'Invalid date format';
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of today
        const dateOnly = new Date(date);
        dateOnly.setHours(0, 0, 0, 0); // Set to start of the given date
        if (dateOnly < today) return 'Event date must be today or in the future';
        return true;
      }
    },
    location: { 
      required: true, 
      minLength: 2, 
      maxLength: 500,
      customValidator: (value: any) => {
        if (typeof value !== 'string') return 'Event location must be a string';
        return true;
      }
    },
    budget: {
      required: true,
      customValidator: (value: any) => {
        if (typeof value !== 'number') return 'Budget must be a number';
        if (value < 0) return 'Budget cannot be negative';
        if (value > 100000000) return 'Budget exceeds maximum allowed value';
        return true;
      }
    },
    guestCount: {
      customValidator: (value: any) => {
        if (value === undefined) return true; // Optional field
        if (typeof value !== 'number') return 'Guest count must be a number';
        if (value < 0) return 'Guest count cannot be negative';
        if (value > 100000) return 'Guest count exceeds maximum allowed value';
        return true;
      }
    },
    theme: {
      customValidator: (value: any) => {
        if (value === undefined) return true; // Optional field
        if (typeof value !== 'string') return 'Theme must be a string';
        if (value.length > 100) return 'Theme is too long';
        return true;
      }
    },
    notes: {
      customValidator: (value: any) => {
        if (value === undefined) return true; // Optional field
        if (typeof value !== 'string') return 'Notes must be a string';
        if (value.length > 2000) return 'Notes exceed maximum length of 2000 characters';
        return true;
      }
    }
  };

  return validateInput(data, rules);
};

// Booking DTO validators
export const validateCreateBookingRequest = (data: CreateBookingRequest): { isValid: boolean; errors: string[] } => {
  const rules = {
    eventId: { 
      required: true, 
      customValidator: (value: any) => {
        if (typeof value !== 'string') return 'Event ID must be a string';
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return 'Invalid event ID format';
        return true;
      }
    },
    vendorId: { 
      required: true, 
      customValidator: (value: any) => {
        if (typeof value !== 'string') return 'Vendor ID must be a string';
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return 'Invalid vendor ID format';
        return true;
      }
    },
    amount: {
      required: true,
      customValidator: (value: any) => {
        if (typeof value !== 'number') return 'Amount must be a number';
        if (value <= 0) return 'Amount must be greater than 0';
        if (value > 10000000) return 'Amount exceeds maximum allowed value';
        return true;
      }
    },
    notes: {
      customValidator: (value: any) => {
        if (value === undefined) return true; // Optional field
        if (typeof value !== 'string') return 'Notes must be a string';
        if (value.length > 1000) return 'Notes exceed maximum length of 1000 characters';
        return true;
      }
    }
  };

  return validateInput(data, rules);
};

// Generic validation function for any object
export const validateDto = <T>(data: T, validationFn: (data: T) => { isValid: boolean; errors: string[] }): { isValid: boolean; errors: string[] } => {
  return validationFn(data);
};