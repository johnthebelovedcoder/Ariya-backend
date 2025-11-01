import { NextRequest } from 'next/server';
import { VendorInsightPackageService } from '@/lib/vendor-insight-package-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';
import prisma from '@/lib/prisma';

// GET /api/vendor-insights - Get vendor insight packages
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Get vendor ID based on user ID
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user.id }
    });
    
    if (!vendor) {
      return createApiError('User does not have a vendor profile', 400);
    }
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return createApiError('Invalid pagination parameters', 400);
    }
    
    const result = await VendorInsightPackageService.getVendorInsightPackages(vendor.id, page, limit);
    
    return createApiResponse(result, 'Vendor insight packages retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/vendor-insights');
  }
}

// POST /api/vendor-insights - Create a new vendor insight package
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Check if user is a vendor
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user.id }
    });
    
    if (!vendor) {
      return createApiError('User does not have a vendor profile', 400);
    }
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['type', 'amount'];
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    // Validate type
    const validTypes = ['BASIC', 'PREMIUM', 'CUSTOM_REPORT'];
    if (!validTypes.includes(body.type)) {
      return createApiError('Invalid insight package type', 400);
    }
    
    // Validate amount is positive
    if (typeof body.amount !== 'number' || body.amount <= 0) {
      return createApiError('Amount must be a positive number', 400);
    }
    
    const pkg = await VendorInsightPackageService.createVendorInsightPackage({
      vendorId: vendor.id,
      type: body.type,
      amount: body.amount,
      paymentStatus: body.paymentStatus,
      details: body.details,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    }, vendor.id);
    
    return createApiResponse(pkg, 'Vendor insight package created successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/vendor-insights');
  }
}