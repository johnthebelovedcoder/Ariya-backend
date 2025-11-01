import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from './modules/prisma/prisma.service';

@ApiTags('Health Check')
@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'System is healthy' })
  @ApiResponse({ status: 503, description: 'System is unhealthy' })
  async healthCheck() {
    const startTime = Date.now();

    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;
      
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

      return healthStatus;
    } catch (error) {
      const duration = Date.now() - startTime;

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

      // Set the status code to 503 in the response
      throw { status: 503, message: 'Health check failed', ...healthStatus };
    }
  }
}