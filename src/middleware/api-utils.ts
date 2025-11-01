import { NextResponse } from 'next/server';

interface ApiErrorOptions {
  code?: string;
  details?: Record<string, any>;
  retryAfter?: number;
  remaining?: number;
}

export function createApiError(
  message: string,
  status: number = 500,
  options: ApiErrorOptions = {}
) {
  return {
    success: false,
    error: {
      message,
      code: options.code || 'INTERNAL_ERROR',
      status,
      ...(options.details && { details: options.details }),
      ...(options.retryAfter !== undefined && { retryAfter: options.retryAfter }),
      ...(options.remaining !== undefined && { remaining: options.remaining }),
    },
  };
}

export function createApiResponse<T = any>(
  data: T,
  meta: Record<string, any> = {}
) {
  return {
    success: true,
    data,
    ...(Object.keys(meta).length > 0 && { meta }),
  };
}

export function createPaginatedResponse<T = any>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  meta: Record<string, any> = {}
) {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return createApiResponse(data, {
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
    ...meta,
  });
}

export function handleApiError(error: any): NextResponse {
  console.error('API Error:', error);
  
  if (error.name === 'ZodError') {
    return NextResponse.json(
      createApiError('Validation error', 400, {
        code: 'VALIDATION_ERROR',
        details: error.errors,
      }),
      { status: 400 }
    );
  }

  if (error.status && error.status >= 400 && error.status < 500) {
    return NextResponse.json(
      createApiError(error.message || 'Bad Request', error.status, {
        code: error.code || 'BAD_REQUEST',
        details: error.details,
      }),
      { status: error.status }
    );
  }

  return NextResponse.json(
    createApiError('Internal Server Error', 500, {
      code: 'INTERNAL_SERVER_ERROR',
    }),
    { status: 500 }
  );
}
