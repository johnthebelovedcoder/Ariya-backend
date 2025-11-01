import prisma from './prisma';
import { Prisma } from '@prisma/client';

/**
 * Transaction wrapper for executing multiple database operations atomically
 * 
 * @example
 * const result = await withTransaction(async (tx) => {
 *   const user = await tx.user.create({ data: { ... } });
 *   await tx.vendor.create({ data: { userId: user.id, ... } });
 *   return user;
 * });
 */
export async function withTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: {
    maxWait?: number;
    timeout?: number;
  }
): Promise<T> {
  return await prisma.$transaction(callback, {
    maxWait: options?.maxWait ?? 5000, // 5 seconds
    timeout: options?.timeout ?? 10000, // 10 seconds
  });
}

/**
 * Execute a callback with retry logic for handling transient failures
 * Useful for operations that might fail due to deadlocks or connection issues
 * 
 * @example
 * const result = await withRetry(async () => {
 *   return await someOperation();
 * }, { maxRetries: 3, delayMs: 1000 });
 */
export async function withRetry<T>(
  callback: () => Promise<T>,
  options?: {
    maxRetries?: number;
    delayMs?: number;
    onRetry?: (error: Error, attempt: number) => void;
  }
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3;
  const delayMs = options?.delayMs ?? 1000;
  
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await callback();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on unique constraint violations or other non-transient errors
      if ((error as any).code === 'P2002') {
        throw error;
      }
      
      if (attempt < maxRetries) {
        options?.onRetry?.(lastError, attempt);
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  
  throw lastError!;
}

/**
 * Batch operations helper for efficient bulk operations
 * Automatically chunks large arrays to avoid overwhelming the database
 * 
 * @example
 * await batchOperation(
 *   largeArrayOfData,
 *   async (batch, tx) => {
 *     await tx.user.createMany({ data: batch });
 *   },
 *   { batchSize: 100 }
 * );
 */
export async function batchOperation<T>(
  items: T[],
  operation: (batch: T[], tx: Prisma.TransactionClient) => Promise<void>,
  options?: {
    batchSize?: number;
    useTransaction?: boolean;
  }
): Promise<void> {
  const batchSize = options?.batchSize ?? 100;
  const useTransaction = options?.useTransaction ?? true;
  
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  
  if (useTransaction) {
    await withTransaction(async (tx) => {
      for (const batch of batches) {
        await operation(batch, tx);
      }
    });
  } else {
    for (const batch of batches) {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await operation(batch, tx);
      });
    }
  }
}

/**
 * Optimistic locking helper to prevent concurrent update conflicts
 * Uses a version field to ensure data hasn't changed since it was read
 * 
 * @example
 * await withOptimisticLock(
 *   'user',
 *   userId,
 *   currentVersion,
 *   async (tx) => {
 *     return await tx.user.update({
 *       where: { id: userId },
 *       data: { name: 'New Name', version: { increment: 1 } }
 *     });
 *   }
 * );
 */
export async function withOptimisticLock<T>(
  model: string,
  id: string,
  expectedVersion: number,
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return await withTransaction(async (tx) => {
    // Check current version
    const current = await (tx as any)[model].findUnique({
      where: { id },
      select: { version: true }
    });
    
    if (!current) {
      throw new Error(`${model} with id ${id} not found`);
    }
    
    if (current.version !== expectedVersion) {
      throw new Error(
        `Optimistic lock failed: ${model} was modified by another process. ` +
        `Expected version ${expectedVersion}, got ${current.version}`
      );
    }
    
    return await callback(tx);
  });
}

/**
 * Idempotent operation helper using idempotency keys
 * Prevents duplicate operations from being executed
 * 
 * Note: Requires an IdempotencyKey model in your schema
 */
export async function withIdempotency<T>(
  idempotencyKey: string,
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ttlSeconds: number = 86400 // 24 hours
): Promise<T> {
  return await withTransaction(async (tx) => {
    // Check if this operation was already performed
    const existing = await tx.idempotencyKey.findUnique({
      where: { key: idempotencyKey }
    });
    
    if (existing) {
      // Return cached result if available
      return existing.result as T;
    }
    
    // Execute the operation
    const result = await callback(tx);
    
    // Store the result with the idempotency key
    await tx.idempotencyKey.create({
      data: {
        key: idempotencyKey,
        result: result as any,
        expiresAt: new Date(Date.now() + ttlSeconds * 1000)
      }
    });
    
    return result;
  });
}
