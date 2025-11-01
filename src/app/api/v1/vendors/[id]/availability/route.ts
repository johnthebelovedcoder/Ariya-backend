import { NextRequest } from 'next/server';
import { VendorService } from '@/lib/vendor-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/vendors/[vendorId]/availability - Get availability calendar
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: vendorId } = params;
    
    if (!vendorId) {
      return createApiError('Vendor ID is required', 400);
    }
    
    // This endpoint can be public - anyone can check vendor availability
    const vendor = await VendorService.getVendorById(vendorId);
    if (!vendor) {
      return createApiError('Vendor not found', 404);
    }
    
    // In a real implementation, this would fetch the vendor's availability calendar
    // For now, return mock availability data
    const availabilityData = {
      vendorId,
      businessName: vendor.businessName,
      availability: vendor.availability || {
        monday: { open: '09:00', close: '17:00' },
        tuesday: { open: '09:00', close: '17:00' },
        wednesday: { open: '09:00', close: '17:00' },
        thursday: { open: '09:00', close: '17:00' },
        friday: { open: '09:00', close: '17:00' },
        saturday: { open: '10:00', close: '16:00' },
        sunday: { open: null, close: null } // Closed
      },
      blockedDates: [
        '2024-12-25', // Christmas
        '2024-01-01', // New Year
        '2024-06-12'  // Democracy Day
      ],
      timeZone: vendor.user?.timezone || 'Africa/Lagos'
    };
    
    return createApiResponse(availabilityData, 'Vendor availability retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/vendors/[vendorId]/availability');
  }
}

// PUT /api/vendors/[vendorId]/availability - Update availability
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: vendorId } = params;
    
    if (!vendorId) {
      return createApiError('Vendor ID is required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Verify this is the vendor's account
    const vendor = await VendorService.getVendorById(vendorId);
    if (!vendor || vendor.userId !== user.id) {
      return createApiError('You do not have permission to update this vendor\'s availability', 403);
    }
    
    const body = await request.json();
    
    // Validate availability data
    if (!body.availability) {
      return createApiError('Availability data is required', 400);
    }
    
    // Update the vendor's availability
    const updatedVendor = await VendorService.updateVendor(vendorId, user.id, {
      availability: body.availability
    });
    
    return createApiResponse({
      vendorId: updatedVendor.id,
      availability: updatedVendor.availability,
      updatedAt: updatedVendor.updatedAt
    }, 'Vendor availability updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/vendors/[vendorId]/availability');
  }
}