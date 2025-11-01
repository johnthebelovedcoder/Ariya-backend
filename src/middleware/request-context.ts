import { NextRequest } from 'next/server';
import crypto from 'crypto';
import Logger from '@/lib/logger-service';

/**
 * Request context for tracking and logging
 */
export interface RequestContext {
  requestId: string;
  startTime: number;
  ip: string;
  userAgent: string;
  method: string;
  url: string;
}

/**
 * Create request context from NextRequest
 * Generates unique request ID and captures metadata
 */
export function createRequestContext(request: NextRequest): RequestContext {
  const requestId = request.headers.get('x-request-id') || 
                    `req_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             request.headers.get('cf-connecting-ip') ||
             'unknown';
  
  return {
    requestId,
    startTime: Date.now(),
    ip,
    userAgent: request.headers.get('user-agent') || 'unknown',
    method: request.method,
    url: request.url
  };
}

/**
 * Log request start with context
 */
export function logRequestStart(context: RequestContext, additionalData?: Record<string, any>) {
  Logger.http('Request started', {
    requestId: context.requestId,
    method: context.method,
    url: context.url,
    ip: context.ip,
    userAgent: context.userAgent,
    ...additionalData
  });
}

/**
 * Log request completion with duration and status
 */
export function logRequestEnd(
  context: RequestContext,
  statusCode: number,
  userId?: string,
  additionalData?: Record<string, any>
) {
  const duration = Date.now() - context.startTime;
  
  const logData = {
    requestId: context.requestId,
    method: context.method,
    url: context.url,
    statusCode,
    duration: `${duration}ms`,
    ip: context.ip,
    userId,
    ...additionalData
  };
  
  // Log at appropriate level based on status code
  if (statusCode >= 500) {
    Logger.error('Request failed', logData);
  } else if (statusCode >= 400) {
    Logger.warn('Request error', logData);
  } else {
    Logger.http('Request completed', logData);
  }
  
  // Log slow requests
  if (duration > 1000) {
    Logger.warn('Slow request detected', {
      requestId: context.requestId,
      duration: `${duration}ms`,
      url: context.url
    });
  }
}

/**
 * Log request error with full context
 */
export function logRequestError(
  context: RequestContext,
  error: Error | unknown,
  userId?: string
) {
  Logger.error('Request error occurred', {
    requestId: context.requestId,
    method: context.method,
    url: context.url,
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    ip: context.ip,
    userId,
    duration: `${Date.now() - context.startTime}ms`
  });
}
