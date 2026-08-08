import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';
const connectionString = process.env.DATABASE_URL || '';

const useMock = process.env.NODE_ENV !== 'production' && (!connectionString || connectionString.includes('[password]'));

// Validate connection string at runtime startup ONLY if NOT using mock
if (!isBuildTime && !useMock) {
  if (!connectionString || connectionString.includes('[password]')) {
    throw new Error('Missing DATABASE_URL environment variable or it contains default placeholders.');
  }
}

let prismaInstance: any;

if (useMock) {
  if (typeof window === 'undefined') {
    console.log('--- DATABASE_URL is placeholder/empty. Initializing local JSON Prisma Mock ---');
  }
  
  const dbPath = path.join(process.cwd(), 'database', 'db.json');

  const getDB = () => {
    try {
      if (!fs.existsSync(dbPath)) {
        return {
          settings: {},
          users: [],
          bookings: [],
          testimonials: [],
          faqs: [],
          pricing: [],
          blogs: [],
          portfolio: [],
          gallery: [],
          clients: [],
          invoices: [],
          invoiceItems: [],
          payments: [],
          admins: []
        };
      }
      const content = fs.readFileSync(dbPath, 'utf8');
      const db = JSON.parse(content);
      if (!db.admins) {
        db.admins = [
          {
            id: 'a6d2bc17-8e6f-44e2-a059-e93cf80e4180',
            username: 'admin',
            password: '$2b$10$CawfJ8D10o6RU7OwLRJwwuQ8KX8EKelZM6y/DB3gHCrDjPUclbKG6',
            email: 'admin@framebydb.com'
          }
        ];
      }
      if (!db.invoiceItems) db.invoiceItems = [];
      if (!db.payments) db.payments = [];
      return db;
    } catch (e) {
      console.error('Error reading mock database:', e);
      return {};
    }
  };

  const saveDB = (db: any) => {
    try {
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
    } catch (e) {
      console.error('Error writing mock database:', e);
    }
  };

  const modelMap: Record<string, string> = {
    setting: 'settings',
    user: 'users',
    booking: 'bookings',
    testimonial: 'testimonials',
    fAQ: 'faqs',
    package: 'pricing',
    blog: 'blogs',
    portfolio: 'portfolio',
    gallery: 'gallery',
    client: 'clients',
    invoice: 'invoices',
    invoiceItem: 'invoiceItems',
    payment: 'payments',
    admin: 'admins'
  };

  const createQueryHandler = (modelName: string) => {
    const modelKey = modelMap[modelName];
    return {
      findMany: async (args?: any) => {
        const db = getDB();
        let items = db[modelKey];
        if (!items) return [];
        if (!Array.isArray(items)) items = [items];
        
        // Handle filter
        if (args && args.where) {
          items = items.filter((item: any) => {
            for (const key in args.where) {
              let targetVal = args.where[key];
              if (targetVal && typeof targetVal === 'object') {
                if ('equals' in targetVal) targetVal = targetVal.equals;
                else if ('in' in targetVal) {
                  if (!targetVal.in.includes(item[key])) return false;
                  continue;
                }
              }
              const itemVal = item[key];
              if (String(itemVal).toLowerCase() !== String(targetVal).toLowerCase()) {
                return false;
              }
            }
            return true;
          });
        }
        
        // Handle sorting
        if (args && args.orderBy) {
          const sortKey = Object.keys(args.orderBy)[0];
          const sortDir = args.orderBy[sortKey];
          items = [...items].sort((a: any, b: any) => {
            const valA = a[sortKey];
            const valB = b[sortKey];
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
          });
        }
        
        // Handle includes
        if (args && args.include) {
          items = items.map((item: any) => {
            const enriched = { ...item };
            if (args.include.items && modelKey === 'invoices') {
              enriched.items = db.invoiceItems.filter((ii: any) => ii.invoiceId === item.id);
            }
            if (args.include.payments && modelKey === 'invoices') {
              enriched.payments = db.payments.filter((p: any) => p.invoiceId === item.id);
            }
            return enriched;
          });
        }
        
        return items;
      },
      findFirst: async (args?: any) => {
        const db = getDB();
        if (modelKey === 'settings') {
          return db.settings || null;
        }
        const handler = createQueryHandler(modelName);
        const results = await handler.findMany(args);
        return results[0] || null;
      },
      findUnique: async (args?: any) => {
        const db = getDB();
        if (modelKey === 'settings') {
          return db.settings || null;
        }
        const handler = createQueryHandler(modelName);
        const results = await handler.findMany(args);
        return results[0] || null;
      },
      create: async (args: any) => {
        const db = getDB();
        const data = { ...args.data };
        const id = data.id || crypto.randomUUID();
        data.id = id;
        data.createdAt = new Date().toISOString();
        data.updatedAt = new Date().toISOString();

        // Handle nested items creation
        if (data.items && data.items.create) {
          const nestedItems = data.items.create.map((item: any) => ({
            id: crypto.randomUUID(),
            invoiceId: id,
            ...item
          }));
          db.invoiceItems = [...(db.invoiceItems || []), ...nestedItems];
          delete data.items;
        }
        
        // Handle nested payments creation
        if (data.payments && data.payments.create) {
          const nestedPayments = Array.isArray(data.payments.create)
            ? data.payments.create.map((p: any) => ({
                id: crypto.randomUUID(),
                invoiceId: id,
                ...p
              }))
            : [{
                id: crypto.randomUUID(),
                invoiceId: id,
                ...data.payments.create
              }];
          db.payments = [...(db.payments || []), ...nestedPayments];
          delete data.payments;
        }

        if (modelKey === 'settings') {
          db.settings = data;
        } else {
          if (!db[modelKey]) db[modelKey] = [];
          db[modelKey].push(data);
        }

        saveDB(db);

        const returnedData = { ...data };
        if (args && args.include) {
          if (args.include.items && modelKey === 'invoices') {
            returnedData.items = db.invoiceItems.filter((ii: any) => ii.invoiceId === id);
          }
          if (args.include.payments && modelKey === 'invoices') {
            returnedData.payments = db.payments.filter((p: any) => p.invoiceId === id);
          }
        }
        return returnedData;
      },
      update: async (args: any) => {
        const db = getDB();
        
        if (modelKey === 'settings') {
          db.settings = { ...db.settings, ...args.data };
          saveDB(db);
          return db.settings;
        }

        let itemIndex = -1;
        if (args.where && args.where.id) {
          itemIndex = db[modelKey].findIndex((i: any) => i.id === args.where.id);
        } else if (args.where && args.where.username) {
          itemIndex = db[modelKey].findIndex((i: any) => i.username === args.where.username);
        } else if (args.where && args.where.accessKey) {
          itemIndex = db[modelKey].findIndex((i: any) => i.accessKey === args.where.accessKey);
        }

        if (itemIndex === -1) {
          throw new Error(`${modelName} record to update not found`);
        }

        const currentItem = db[modelKey][itemIndex];
        const data = { ...args.data };
        
        // Handle nested items update
        if (data.items && data.items.create) {
          const nestedItems = data.items.create.map((item: any) => ({
            id: crypto.randomUUID(),
            invoiceId: currentItem.id,
            ...item
          }));
          db.invoiceItems = [...(db.invoiceItems || []), ...nestedItems];
          delete data.items;
        }

        const updatedItem = {
          ...currentItem,
          ...data,
          updatedAt: new Date().toISOString()
        };

        db[modelKey][itemIndex] = updatedItem;
        saveDB(db);

        const returnedItem = { ...updatedItem };
        if (args && args.include) {
          if (args.include.items && modelKey === 'invoices') {
            returnedItem.items = db.invoiceItems.filter((ii: any) => ii.invoiceId === currentItem.id);
          }
          if (args.include.payments && modelKey === 'invoices') {
            returnedItem.payments = db.payments.filter((p: any) => p.invoiceId === currentItem.id);
          }
        }
        return returnedItem;
      },
      delete: async (args: any) => {
        const db = getDB();
        let itemIndex = -1;
        if (args.where && args.where.id) {
          itemIndex = db[modelKey].findIndex((i: any) => i.id === args.where.id);
        }
        if (itemIndex !== -1) {
          const deleted = db[modelKey].splice(itemIndex, 1)[0];
          saveDB(db);
          return deleted;
        }
        return null;
      },
      deleteMany: async (args?: any) => {
        const db = getDB();
        if (args && args.where) {
          if (args.where.invoiceId) {
            db[modelKey] = db[modelKey].filter((i: any) => i.invoiceId !== args.where.invoiceId);
          } else {
            db[modelKey] = [];
          }
        } else {
          db[modelKey] = [];
        }
        saveDB(db);
        return { count: 0 };
      }
    };
  };

  prismaInstance = new Proxy({}, {
    get: (target, prop: string) => {
      return createQueryHandler(prop);
    }
  });

} else {
  const pool = new Pool({
    connectionString,
  });
  const adapter = new PrismaPg(pool);
  const globalForPrisma = global as unknown as { prisma: PrismaClient };
  prismaInstance = globalForPrisma.prisma || new PrismaClient({ adapter });
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaInstance;
}

export const prisma = prismaInstance;

