import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';
const connectionString = process.env.DATABASE_URL || '';

// Validate connection string at runtime startup
if (!isBuildTime) {
  if (!connectionString || connectionString.includes('[password]')) {
    throw new Error('Missing DATABASE_URL');
  }
}

// Create a native pg pool with fallback to prevent initialization crash if URL is empty or placeholder at build time
const activeConnectionString = !connectionString || connectionString.includes('[password]')
  ? 'postgresql://postgres:postgres@localhost:5432/postgres'
  : connectionString;

const pool = new Pool({
  connectionString: activeConnectionString,
});

// Create driver adapter
const adapter = new PrismaPg(pool);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
