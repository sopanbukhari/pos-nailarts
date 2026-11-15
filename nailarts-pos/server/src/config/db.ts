import { PrismaClient } from '@prisma/client';

// Standard production-ready Prisma client for PostgreSQL
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export default prisma;
