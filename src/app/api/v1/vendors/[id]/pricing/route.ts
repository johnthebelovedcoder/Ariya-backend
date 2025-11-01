import { NextRequest } from 'next/server';
import { VendorService } from '@/lib/vendor-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError, sanitizeInput } from '@/lib/api-utils';
import { validateInput } from '@/lib/validation';

// PUT /api/vendors/[vendorId]/pricing - Update pricing information
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: vendorId } = params;
    
    // Validate vendor ID
    if (!vendorId || typeof vendorId !== 'string' || vendorId.trim().length === 0) {
      return createApiError('Vendor ID is required', 400);
    }
    
    // Validate vendor ID format (assuming it's a UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(vendorId)) {
      return createApiError('Invalid vendor ID format', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Verify this is the vendor's account
    const vendor = await VendorService.getVendorById(vendorId);
    if (!vendor || vendor.userId !== user.id) {
      return createApiError('You do not have permission to update this vendor\'s pricing', 403);
    }
    
    const body = await request.json();
    
    // Sanitize input
    const sanitizedBody = sanitizeInput(body);
    
    // Validate pricing data
    const validationRules = {
      pricing: { 
        customValidator: (value: any) => {
          if (value === undefined) return true; // Optional field
          if (typeof value !== 'number' || value < 0) return 'Pricing must be a non-negative number';
          if (!Number.isFinite(value)) return 'Pricing must be a finite number';
          return true;
        }
      },
      pricingModel: {
        customValidator: (value: any) => {
          if (value === undefined) return true; // Optional field
          const validModels = ['hourly', 'per_event', 'package', 'fixed', 'negotiable'];
          if (!validModels.includes(value)) return `Pricing model must be one of: ${validModels.join(', ')}`;
          return true;
        }
      },
      minimumCharge: {
        customValidator: (value: any) => {
          if (value === undefined) return true; // Optional field
          if (typeof value !== 'number' || value < 0) return 'Minimum charge must be a non-negative number';
          return true;
        }
      },
      currency: {
        customValidator: (value: any) => {
          if (value === undefined) return true; // Optional field
          // Basic currency code validation (3 letters)
          if (typeof value !== 'string' || !/^[A-Z]{3}$/.test(value)) return 'Currency must be a 3-letter code (e.g., USD)';
          return true;
        }
      }
    };
    
    const validation = validateInput(sanitizedBody, validationRules);
    if (!validation.isValid) {
      return createApiError(`Validation failed: ${validation.errors.join(', ')}`, 400);
    }
    
    // Update vendor pricing
    const updatedVendor = await VendorService.updateVendor(vendorId, user.id, {
      pricing: sanitizedBody.pricing,
      pricingModel: sanitizedBody.pricingModel,
      minimumCharge: sanitizedBody.minimumCharge,
      currency: sanitizedBody.currency
    });
    
    return createApiResponse({
      vendorId: updatedVendor.id,
      pricing: updatedVendor.pricing,
      pricingModel: updatedVendor.pricingModel,
      minimumCharge: updatedVendor.minimumCharge,
      currency: updatedVendor.currency,
      updatedAt: updatedVendor.updatedAt
    }, 'Vendor pricing updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/vendors/[vendorId]/pricing');
  }
}