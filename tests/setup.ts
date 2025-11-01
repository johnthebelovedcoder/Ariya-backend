// tests/setup.ts
import { afterAll, afterEach, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import prisma from '../src/lib/prisma';

// Set test environment
if (process.env.NODE_ENV !== 'test') {
  Object.defineProperty(process.env, 'NODE_ENV', {
    value: 'test',
    writable: true,
  });
}

// Use test database URL if provided
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

// Setup function to run before all tests
beforeAll(async () => {
  console.log('Setting up test environment...');
  
  try {
    // Run database migrations
    console.log('Running database migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    // Generate Prisma client
    console.log('Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log('✓ Test environment setup complete');
  } catch (error) {
    console.error('Failed to setup test environment:', error);
    throw error;
  }
});

// Clean up function to run after all tests
afterAll(async () => {
  console.log('Cleaning up test environment...');
  
  try {
    // Disconnect from database
    await prisma.$disconnect();
    console.log('✓ Test environment cleanup complete');
  } catch (error) {
    console.error('Failed to cleanup test environment:', error);
    throw error;
  }
});

// Reset function to run after each test
afterEach(async () => {
  // Clean up test data after each test
  // This ensures tests don't interfere with each other
  
  try {
    // Delete all records in reverse order of dependencies
    // This prevents foreign key constraint violations
    
    const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;

    for (const { tablename } of tablenames) {
      if (tablename !== '_prisma_migrations') {
        try {
          await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
        } catch (error) {
          console.log(`Could not truncate ${tablename}, skipping...`);
        }
      }
    }
  } catch (error) {
    console.error('Failed to clean up test data:', error);
  }
});