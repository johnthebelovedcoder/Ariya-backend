import { NextRequest } from 'next/server';
import { AdminService } from '@/lib/admin-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/admin/transaction-fees - Get transaction fee configuration
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Verify user is admin
    const isAdmin = await AdminService.verifyAdmin(user.id);
    if (!isAdmin) {
      return createApiError('Access denied. Admin privileges required.', 403);
    }
    
    // Get transaction fee configuration
    const feeConfig = await AdminService.getTransactionFeeConfig();
    
    return createApiResponse(feeConfig, 'Transaction fee configuration retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/admin/transaction-fees');
  }
}

// PUT /api/admin/transaction-fees - Update transaction fees
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Verify user is admin
    const isAdmin = await AdminService.verifyAdmin(user.id);
    if (!isAdmin) {
      return createApiError('Access denied. Admin privileges required.', 403);
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (body.percentage === undefined && body.fixedAmount === undefined) {
      return createApiError('Either percentage or fixedAmount is required', 400);
    }
    
    // Validate numeric fields
    if (body.percentage !== undefined && (typeof body.percentage !== 'number' || body.percentage < 0 || body.percentage > 100)) {
      return createApiError('percentage must be a number between 0 and 100', 400);
    }
    
    if (body.fixedAmount !== undefined && (typeof body.fixedAmount !== 'number' || body.fixedAmount < 0)) {
      return createApiError('fixedAmount must be a non-negative number', 400);
    }
    
    // Validate other fields
    if (body.minAmount !== undefined && (typeof body.minAmount !== 'number' || body.minAmount < 0)) {
      return createApiError('minAmount must be a non-negative number', 400);
    }
    
    if (body.maxAmount !== undefined && (typeof body.maxAmount !== 'number' || body.maxAmount < 0)) {
      return createApiError('maxAmount must be a non-negative number', 400);
    }
    
    // Update transaction fees
    const updatedConfig = await AdminService.updateTransactionFees({
      percentage: body.percentage,
      fixedAmount: body.fixedAmount,
      minAmount: body.minAmount,
      maxAmount: body.maxAmount,
      currency: body.currency || 'NGN',
      description: body.description,
      enabled: body.enabled
    }, user.id);
    
    return createApiResponse(updatedConfig, 'Transaction fees updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/admin/transaction-fees');
  }
}