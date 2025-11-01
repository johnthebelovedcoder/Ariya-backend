import prisma from './prisma';
import Logger from './logger-service';

/**
 * Graceful shutdown handler
 * Ensures all connections are properly closed before process exits
 */

let isShuttingDown = false;

export async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    Logger.warn('Shutdown already in progress, forcing exit...');
    process.exit(1);
  }

  isShuttingDown = true;
  Logger.info(`${signal} received, starting graceful shutdown...`);

  // Set a timeout to force shutdown if graceful shutdown takes too long
  const forceShutdownTimeout = setTimeout(() => {
    Logger.error('Graceful shutdown timeout, forcing exit');
    process.exit(1);
  }, 30000); // 30 seconds

  try {
    // Close database connections
    Logger.info('Closing database connections...');
    await prisma.$disconnect();
    Logger.info('✓ Database connections closed');

    // Close Redis connection if available
    try {
      const redisClient = (await import('./redis-client')).default;
      if (redisClient && redisClient.isReady()) {
        Logger.info('Closing Redis connection...');
        await redisClient.disconnect();
        Logger.info('✓ Redis connection closed');
      }
    } catch (error) {
      Logger.warn('Redis client not available or already closed');
    }

    // Clean up any other resources here
    // - Close HTTP servers
    // - Finish processing queued jobs
    // - Save state to disk
    // etc.

    clearTimeout(forceShutdownTimeout);
    Logger.info('✓ Graceful shutdown completed successfully');
    process.exit(0);
  } catch (error) {
    clearTimeout(forceShutdownTimeout);
    Logger.error('Error during graceful shutdown', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
}

/**
 * Setup graceful shutdown handlers
 * Call this in your application entry point
 */
export function setupGracefulShutdown(): void {
  // Handle SIGTERM (sent by Docker, Kubernetes, etc.)
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    Logger.error('Uncaught exception', {
      error: error.message,
      stack: error.stack,
    });
    gracefulShutdown('uncaughtException');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    Logger.error('Unhandled promise rejection', {
      reason,
      promise,
    });
    gracefulShutdown('unhandledRejection');
  });

  Logger.info('Graceful shutdown handlers registered');
}

export default { gracefulShutdown, setupGracefulShutdown };
