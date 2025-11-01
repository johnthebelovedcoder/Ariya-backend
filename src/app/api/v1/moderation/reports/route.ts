import { NextRequest } from 'next/server';
import { ModerationService } from '@/lib/moderation-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';
import { UserRole } from '@prisma/client';

// GET /api/moderation/reports - Get moderation reports (Admin/Trust & Safety only)
export async function GET(request: NextRequest) {
  try {
    // Require admin or trust & safety permissions
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // For this implementation, we'll allow admins and also track trust & safety access
    if (user.role !== 'ADMIN') {
      // In a real implementation, you would also check for Trust & Safety team members
      return createApiError('Access denied: Insufficient permissions', 403);
    }
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING_REVIEW';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return createApiError('Invalid pagination parameters', 400);
    }
    
    // Validate status parameter
    const validStatuses = ['PENDING_REVIEW', 'IN_REVIEW', 'RESOLVED'];
    if (!validStatuses.includes(status)) {
      return createApiError('Invalid status parameter', 400);
    }
    
    const result = await ModerationService.getReportsForReview(
      status as 'PENDING_REVIEW' | 'IN_REVIEW' | 'RESOLVED',
      page,
      limit
    );
    
    return createApiResponse(result, 'Moderation reports retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/moderation/reports');
  }
}