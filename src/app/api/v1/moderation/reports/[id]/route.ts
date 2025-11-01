import { NextRequest } from 'next/server';
import { ModerationService } from '@/lib/moderation-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';
import { UserRole } from '@prisma/client';

// PUT /api/moderation/reports/[id] - Update a moderation report status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return createApiError('Report ID is required', 400);
    }
    
    // Require admin or trust & safety permissions
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    if (user.role !== 'ADMIN') {
      return createApiError('Access denied: Insufficient permissions', 403);
    }
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['status'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    // Validate status parameter
    const validStatuses = ['PENDING_REVIEW', 'IN_REVIEW', 'RESOLVED'];
    if (!validStatuses.includes(body.status)) {
      return createApiError('Invalid status parameter', 400);
    }
    
    const report = await ModerationService.updateReportStatus(
      id,
      body.status as 'PENDING_REVIEW' | 'IN_REVIEW' | 'RESOLVED',
      user.id,
      body.resolutionNotes
    );
    
    return createApiResponse(report, 'Moderation report updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/moderation/reports/[id]');
  }
}