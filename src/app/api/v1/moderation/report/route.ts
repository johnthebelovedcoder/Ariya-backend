import { NextRequest } from 'next/server';
import { ModerationService } from '@/lib/moderation-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// POST /api/moderation/report - Create a new user report
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['reportedUserId', 'contentId', 'contentType', 'reason'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    // Validate content type
    const validContentTypes = ['message', 'profile', 'vendor'];
    if (!validContentTypes.includes(body.contentType)) {
      return createApiError('Invalid content type', 400);
    }
    
    // Check that user is not reporting themselves
    if (user.id === body.reportedUserId) {
      return createApiError('You cannot report yourself', 400);
    }
    
    const report = await ModerationService.createReport(
      user.id,
      body.reportedUserId,
      body.contentId,
      body.contentType as 'message' | 'profile' | 'vendor',
      body.reason
    );
    
    return createApiResponse(report, 'Report submitted successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/moderation/report');
  }
}