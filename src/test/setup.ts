// Test setup file
import { prisma } from '../lib/prisma';

// Ensure tests run in test environment
if (process.env.NODE_ENV !== 'test') {
  console.warn('⚠️  Tests should run with NODE_ENV=test');
}

// Global test timeout
jest.setTimeout(10000);

// Cleanup after all tests
afterAll(async () => {
  await prisma.$disconnect();
});
