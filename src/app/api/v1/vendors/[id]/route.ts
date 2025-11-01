import { NextRequest } from 'next/server';
import { VendorService } from '@/lib/vendor-service';
import { requireAuthApi, requireRoleAuthApi, createApiResponse, createApiError } from '@/lib/api-utils';

// GET /api/vendors/[id] - Get vendor by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  if (!id) {
    return createApiError('Vendor ID is required', 400);
  }
  
  try {
    const vendor = await VendorService.getVendorById(id);
    
    if (!vendor) {
      return createApiError('Vendor not found', 404);
    }
    
    return createApiResponse(vendor, 'Vendor retrieved successfully');
  } catch (error: any) {
    console.error('Error retrieving vendor:', error);
    return createApiError('Failed to retrieve vendor', 500);
  }
}

// PUT /api/vendors/[id] - Update vendor by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  if (!id) {
    return createApiError('Vendor ID is required', 400);
  }
  
  const authResult = await requireAuthApi();
  
  if (!('session' in authResult)) {
    return authResult; // Return error response
  }
  
  const { user } = authResult;
  
  try {
    const body = await request.json();
    
    // Validate numeric fields if provided
    if (body.pricing !== undefined && (typeof body.pricing !== 'number' || body.pricing < 0)) {
      return createApiError('Pricing must be a positive number', 400);
    }
    
    if (body.portfolio && !Array.isArray(body.portfolio)) {
      return createApiError('Portfolio must be an array of image URLs', 400);
    }
    
    // Check if the authenticated user is the vendor's owner or an admin
    const vendor = await VendorService.getVendorById(id);
    
    if (!vendor) {
      return createApiError('Vendor not found', 404);
    }
    
    if (vendor.userId !== user.id) {
      // Check if user is an admin
      const adminAuthResult = await requireRoleAuthApi(['ADMIN']);
      
      if (!('session' in adminAuthResult)) {
        return createApiError('You do not have permission to update this vendor', 403);
      }
    }
    
    const updatedVendor = await VendorService.updateVendor(id, user.id, {
      businessName: body.businessName,
      description: body.description,
      category: body.category,
      pricing: body.pricing,
      location: body.location,
      portfolio: body.portfolio,
      availability: body.availability,
      subscriptionTier: body.subscriptionTier,
      isVerified: body.isVerified,
    });
    
    return createApiResponse(updatedVendor, 'Vendor updated successfully');
  } catch (error: any) {
    console.error('Error updating vendor:', error);
    
    if (error.message === 'Vendor not found or you do not have permission to update it') {
      return createApiError(error.message, 404);
    }
    
    return createApiError('Failed to update vendor', 500);
  }
}

// DELETE /api/vendors/[id] - Delete vendor by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  if (!id) {
    return createApiError('Vendor ID is required', 400);
  }
  
  const authResult = await requireAuthApi();
  
  if (!('session' in authResult)) {
    return authResult; // Return error response
  }
  
  const { user } = authResult;
  
  try {
    const result = await VendorService.deleteVendor(id, user.id);
    
    if (!result) {
      return createApiError('Vendor not found or you do not have permission to delete it', 404);
    }
    
    return createApiResponse(null, 'Vendor deleted successfully');
  } catch (error: any) {
    console.error('Error deleting vendor:', error);
    return createApiError('Failed to delete vendor', 500);
  }
}