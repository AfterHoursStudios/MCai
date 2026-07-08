/**
 * Prisma Database Client
 *
 * This module exports a singleton Prisma client instance that can be used
 * throughout the application.
 */

import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const createPrismaClient = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
};

export const db = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db;
}

// Export types from Prisma client
export type {
  User,
  WorkerGroup,
  Story,
  Photo,
  Generation,
  GeneratedPost,
  SocialAccount,
  SocialPost,
} from '@prisma/client';
