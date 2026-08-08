// Mock Prisma Client proxy to satisfy Next.js compiler build.
// Actual database operations run via the external Express + Mongoose server.
export const prisma = new Proxy({}, {
  get: () => {
    // Return a dummy chainable structure
    const dummyMethod = async () => null;
    const dummyQuery = {
      findUnique: dummyMethod,
      findMany: async () => [],
      findFirst: dummyMethod,
      create: async () => ({}),
      update: dummyMethod,
      delete: dummyMethod,
      deleteMany: dummyMethod,
      count: async () => 0
    };
    return dummyQuery;
  }
}) as any;
