import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import Logger from '@/lib/logger-service';

/**
 * Health check endpoint for load balancers and monitoring systems
 * GET /api/health
 * 
 * Returns:
 * - 200: System is healthy
 * - 503: System is unhealthy (database connection failed)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    const duration = Date.now() - startTime;
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: {
          status: 'up',
          responseTime: `${duration}ms`,
        },
        memory: {
          used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        },
      },
    };
    
    Logger.debug('Health check passed', healthStatus);
    
    return NextResponse.json(healthStatus, { status: 200 });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    Logger.error('Health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${duration}ms`,
    });
    
    const healthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: 'down',
          error: error instanceof Error ? error.message : 'Database connection failed',
          responseTime: `${duration}ms`,
        },
      },
    };
    
    return NextResponse.json(healthStatus, { status: 503 });
  }
}
