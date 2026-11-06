import fs from 'fs';
import path from 'path';

// Path to persistent database storage file in prisma/
function getDbFile(): string {
  // If running in Vercel or Serverless Lambda environment
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpFile = path.resolve('/tmp', 'dev_data.json');
    if (!fs.existsSync(tmpFile)) {
      const candidates = [
        path.resolve(process.cwd(), 'prisma/dev_data.json'),
        path.resolve(process.cwd(), 'nailarts-pos/prisma/dev_data.json'),
        path.resolve(__dirname, '../../../prisma/dev_data.json'),
        path.resolve(__dirname, '../../prisma/dev_data.json'),
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          try {
            fs.copyFileSync(p, tmpFile);
            break;
          } catch (e) {
            console.error('Failed to copy initial DB to /tmp:', e);
          }
        }
      }
    }
    return tmpFile;
  }

  // Local / standard server environment
  const candidates = [
    path.resolve(__dirname, '../../../prisma/dev_data.json'),
    path.resolve(process.cwd(), 'prisma/dev_data.json'),
    path.resolve(process.cwd(), 'nailarts-pos/prisma/dev_data.json'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return candidates[0];
}

interface DbSchema {
  users: any[];
  customers: any[];
  categories: any[];
  services: any[];
  serviceAddons: any[];
  inventoryItems: any[];
  bookings: any[];
  bookingItems: any[];
  transactions: any[];
  transactionItems: any[];
}

function loadDb(): DbSchema {
  const dbFile = getDbFile();
  try {
    if (fs.existsSync(dbFile)) {
      const content = fs.readFileSync(dbFile, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error loading db file, re-initializing...', err);
  }
  return {
    users: [],
    customers: [],
    categories: [],
    services: [],
    serviceAddons: [],
    inventoryItems: [],
    bookings: [],
    bookingItems: [],
    transactions: [],
    transactionItems: [],
  };
}

function saveDb(data: DbSchema): void {
  try {
    const dbFile = getDbFile();
    const dir = path.dirname(dbFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving db file:', err);
  }
}

// In-memory state cached and synced with filesystem
let db = loadDb();

function matchesFilter(item: any, where: any): boolean {
  if (!where) return true;
  for (const key of Object.keys(where)) {
    const filter = where[key];
    if (filter === undefined) continue;

    if (key === 'OR' && Array.isArray(filter)) {
      const orMatch = filter.some((subWhere) => matchesFilter(item, subWhere));
      if (!orMatch) return false;
      continue;
    }

    if (filter !== null && typeof filter === 'object' && !Array.isArray(filter) && !(filter instanceof Date)) {
      if (filter.contains !== undefined) {
        const itemVal = String(item[key] || '').toLowerCase();
        if (!itemVal.includes(String(filter.contains).toLowerCase())) return false;
      }
      if (filter.gte !== undefined) {
        const itemVal = new Date(item[key]).getTime();
        const gteVal = new Date(filter.gte).getTime();
        if (itemVal < gteVal) return false;
      }
      if (filter.lte !== undefined) {
        const itemVal = new Date(item[key]).getTime();
        const lteVal = new Date(filter.lte).getTime();
        if (itemVal > lteVal) return false;
      }
      if (filter.in !== undefined && Array.isArray(filter.in)) {
        if (!filter.in.includes(item[key])) return false;
      }
      if (filter.not !== undefined) {
        if (filter.not === null && (item[key] === null || item[key] === undefined)) return false;
        if (filter.not !== null && item[key] === filter.not) return false;
      }
    } else {
      if (item[key] !== filter) return false;
    }
  }
  return true;
}

function applySelect(item: any, select: any): any {
  if (!select) return item;
  const result: any = {};
  for (const key of Object.keys(select)) {
    if (select[key]) {
      result[key] = item[key];
    }
  }
  return result;
}

export const prisma = {
  $disconnect: async () => {},

  user: {
    findUnique: async (args: { where: any; select?: any }) => {
      const found = db.users.find((u) => matchesFilter(u, args.where));
      return found ? applySelect(found, args.select) : null;
    },
    findMany: async (args?: { where?: any; select?: any; orderBy?: any }) => {
      let results = db.users.filter((u) => matchesFilter(u, args?.where));
      if (args?.select) results = results.map((u) => applySelect(u, args.select));
      return results;
    },
    create: async (args: { data: any }) => {
      const user = {
        id: args.data.id || `usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        commissionRate: 0.20,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...args.data,
      };
      db.users.push(user);
      saveDb(db);
      return user;
    },
    update: async (args: { where: any; data: any; select?: any }) => {
      const idx = db.users.findIndex((u) => matchesFilter(u, args.where));
      if (idx === -1) throw new Error('User tidak ditemukan.');
      db.users[idx] = { ...db.users[idx], ...args.data, updatedAt: new Date() };
      saveDb(db);
      return applySelect(db.users[idx], args.select);
    },
    deleteMany: async () => {
      db.users = [];
      saveDb(db);
      return { count: 0 };
    },
  },

  customer: {
    findUnique: async (args: { where: any; include?: any }) => {
      const cust = db.customers.find((c) => matchesFilter(c, args.where));
      if (!cust) return null;
      const res = { ...cust };
      if (args.include?.transactions) {
        res.transactions = db.transactions
          .filter((t) => t.customerId === cust.id)
          .map((t) => ({
            ...t,
            items: db.transactionItems.filter((i) => i.transactionId === t.id),
          }));
      }
      if (args.include?.bookings) {
        res.bookings = db.bookings
          .filter((b) => b.customerId === cust.id)
          .map((b) => ({
            ...b,
            artist: db.users.find((u) => u.id === b.artistId),
          }));
      }
      return res;
    },
    findMany: async (args?: { where?: any; include?: any; orderBy?: any }) => {
      let results = db.customers.filter((c) => matchesFilter(c, args?.where));
      if (args?.include?.transactions) {
        results = results.map((c) => ({
          ...c,
          transactions: db.transactions.filter((t) => t.customerId === c.id).slice(0, 3),
        }));
      }
      return results;
    },
    count: async (args?: { where?: any }) => {
      return db.customers.filter((c) => matchesFilter(c, args?.where)).length;
    },
    create: async (args: { data: any }) => {
      const customer = {
        id: args.data.id || `cust-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        loyaltyPoints: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...args.data,
      };
      db.customers.push(customer);
      saveDb(db);
      return customer;
    },
    update: async (args: { where: any; data: any }) => {
      const idx = db.customers.findIndex((c) => matchesFilter(c, args.where));
      if (idx === -1) throw new Error('Customer tidak ditemukan.');
      const updateData = { ...args.data };
      if (updateData.loyaltyPoints?.increment !== undefined) {
        updateData.loyaltyPoints = (db.customers[idx].loyaltyPoints || 0) + updateData.loyaltyPoints.increment;
      }
      db.customers[idx] = { ...db.customers[idx], ...updateData, updatedAt: new Date() };
      saveDb(db);
      return db.customers[idx];
    },
    deleteMany: async () => {
      db.customers = [];
      saveDb(db);
      return { count: 0 };
    },
  },

  category: {
    findMany: async (args?: { include?: any }) => {
      let results = [...db.categories];
      if (args?.include?.services) {
        results = results.map((cat) => ({
          ...cat,
          services: db.services
            .filter((s) => s.categoryId === cat.id && s.isActive)
            .map((s) => ({
              ...s,
              addons: db.serviceAddons.filter((a) => a.serviceId === s.id),
            })),
        }));
      }
      return results;
    },
    create: async (args: { data: any }) => {
      const category = {
        id: args.data.id || `cat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...args.data,
      };
      db.categories.push(category);
      saveDb(db);
      return category;
    },
    deleteMany: async () => {
      db.categories = [];
      saveDb(db);
      return { count: 0 };
    },
  },

  service: {
    findMany: async (args?: { where?: any; include?: any; orderBy?: any }) => {
      let results = db.services.filter((s) => matchesFilter(s, args?.where));
      if (args?.include?.category) {
        results = results.map((s) => ({
          ...s,
          category: db.categories.find((c) => c.id === s.categoryId),
          addons: args?.include?.addons ? db.serviceAddons.filter((a) => a.serviceId === s.id) : undefined,
        }));
      } else if (args?.include?.addons) {
        results = results.map((s) => ({
          ...s,
          addons: db.serviceAddons.filter((a) => a.serviceId === s.id),
        }));
      }
      return results;
    },
    create: async (args: { data: any; include?: any }) => {
      const serviceId = args.data.id || `srv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const { addons, ...restData } = args.data;
      const service = {
        id: serviceId,
        isActive: true,
        durationMinutes: 45,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...restData,
      };
      db.services.push(service);

      if (addons?.create && Array.isArray(addons.create)) {
        for (const a of addons.create) {
          db.serviceAddons.push({
            id: `addon-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            serviceId,
            extraMinutes: 15,
            ...a,
          });
        }
      }
      saveDb(db);

      const res: any = { ...service };
      if (args.include?.addons) {
        res.addons = db.serviceAddons.filter((a) => a.serviceId === serviceId);
      }
      if (args.include?.category) {
        res.category = db.categories.find((c) => c.id === service.categoryId);
      }
      return res;
    },
    update: async (args: { where: any; data: any; include?: any }) => {
      const idx = db.services.findIndex((s) => matchesFilter(s, args.where));
      if (idx === -1) throw new Error('Service tidak ditemukan.');
      db.services[idx] = { ...db.services[idx], ...args.data, updatedAt: new Date() };
      saveDb(db);
      return {
        ...db.services[idx],
        addons: db.serviceAddons.filter((a) => a.serviceId === db.services[idx].id),
        category: db.categories.find((c) => c.id === db.services[idx].categoryId),
      };
    },
    deleteMany: async () => {
      db.services = [];
      saveDb(db);
      return { count: 0 };
    },
  },

  serviceAddon: {
    deleteMany: async () => {
      db.serviceAddons = [];
      saveDb(db);
      return { count: 0 };
    },
  },

  inventoryItem: {
    findMany: async (args?: { where?: any; orderBy?: any }) => {
      return db.inventoryItems.filter((i) => matchesFilter(i, args?.where));
    },
    count: async (args?: { where?: any }) => {
      return db.inventoryItems.filter((i) => matchesFilter(i, args?.where)).length;
    },
    create: async (args: { data: any }) => {
      const item = {
        id: args.data.id || `inv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        unit: 'pcs',
        minStockAlert: 5,
        costPrice: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...args.data,
      };
      db.inventoryItems.push(item);
      saveDb(db);
      return item;
    },
    createMany: async (args: { data: any[] }) => {
      for (const d of args.data) {
        db.inventoryItems.push({
          id: d.id || `inv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...d,
        });
      }
      saveDb(db);
      return { count: args.data.length };
    },
    update: async (args: { where: any; data: any }) => {
      const idx = db.inventoryItems.findIndex((i) => matchesFilter(i, args.where));
      if (idx === -1) throw new Error('Item inventaris tidak ditemukan.');
      const updateData = { ...args.data };
      if (updateData.stockQuantity?.increment !== undefined) {
        updateData.stockQuantity = (db.inventoryItems[idx].stockQuantity || 0) + updateData.stockQuantity.increment;
      }
      db.inventoryItems[idx] = { ...db.inventoryItems[idx], ...updateData, updatedAt: new Date() };
      saveDb(db);
      return db.inventoryItems[idx];
    },
    deleteMany: async () => {
      db.inventoryItems = [];
      saveDb(db);
      return { count: 0 };
    },
  },

  booking: {
    findMany: async (args?: { where?: any; include?: any; orderBy?: any }) => {
      let results = db.bookings.filter((b) => matchesFilter(b, args?.where));
      if (args?.include) {
        results = results.map((b) => ({
          ...b,
          customer: db.customers.find((c) => c.id === b.customerId),
          artist: db.users.find((u) => u.id === b.artistId),
          items: db.bookingItems
            .filter((it) => it.bookingId === b.id)
            .map((it) => ({
              ...it,
              service: db.services.find((s) => s.id === it.serviceId),
            })),
        }));
      }
      return results;
    },
    count: async (args?: { where?: any }) => {
      return db.bookings.filter((b) => matchesFilter(b, args?.where)).length;
    },
    create: async (args: { data: any; include?: any }) => {
      const bookingId = args.data.id || `bk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const { items, ...restData } = args.data;
      const booking = {
        id: bookingId,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...restData,
      };
      db.bookings.push(booking);

      if (items?.create && Array.isArray(items.create)) {
        for (const it of items.create) {
          db.bookingItems.push({
            id: `bkit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            bookingId,
            ...it,
          });
        }
      }
      saveDb(db);

      const res: any = { ...booking };
      if (args.include?.customer) res.customer = db.customers.find((c) => c.id === booking.customerId);
      if (args.include?.artist) res.artist = db.users.find((u) => u.id === booking.artistId);
      if (args.include?.items) {
        res.items = db.bookingItems
          .filter((it) => it.bookingId === bookingId)
          .map((it) => ({
            ...it,
            service: db.services.find((s) => s.id === it.serviceId),
          }));
      }
      return res;
    },
    update: async (args: { where: any; data: any }) => {
      const idx = db.bookings.findIndex((b) => matchesFilter(b, args.where));
      if (idx === -1) throw new Error('Booking tidak ditemukan.');
      db.bookings[idx] = { ...db.bookings[idx], ...args.data, updatedAt: new Date() };
      saveDb(db);
      return db.bookings[idx];
    },
    deleteMany: async () => {
      db.bookings = [];
      saveDb(db);
      return { count: 0 };
    },
  },

  bookingItem: {
    deleteMany: async () => {
      db.bookingItems = [];
      saveDb(db);
      return { count: 0 };
    },
  },

  transaction: {
    findMany: async (args?: { where?: any; include?: any; orderBy?: any; take?: number; skip?: number }) => {
      let results = db.transactions.filter((t) => matchesFilter(t, args?.where));
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (args?.skip !== undefined) results = results.slice(args.skip);
      if (args?.take !== undefined) results = results.slice(0, args.take);

      if (args?.include) {
        results = results.map((t) => ({
          ...t,
          items: db.transactionItems.filter((i) => i.transactionId === t.id),
          customer: db.customers.find((c) => c.id === t.customerId),
          cashier: db.users.find((u) => u.id === t.cashierId),
          artist: db.users.find((u) => u.id === t.artistId),
        }));
      }
      return results;
    },
    findUnique: async (args: { where: any; include?: any }) => {
      const tx = db.transactions.find((t) => matchesFilter(t, args.where));
      if (!tx) return null;
      const res = { ...tx };
      if (args.include?.items) res.items = db.transactionItems.filter((i) => i.transactionId === tx.id);
      if (args.include?.customer) res.customer = db.customers.find((c) => c.id === tx.customerId);
      if (args.include?.cashier) res.cashier = db.users.find((u) => u.id === tx.cashierId);
      if (args.include?.artist) res.artist = db.users.find((u) => u.id === tx.artistId);
      return res;
    },
    count: async (args?: { where?: any }) => {
      return db.transactions.filter((t) => matchesFilter(t, args?.where)).length;
    },
    create: async (args: { data: any; include?: any }) => {
      const txId = args.data.id || `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const { items, ...restData } = args.data;
      const transaction = {
        id: txId,
        discount: 0,
        tax: 0,
        paymentMethod: 'CASH',
        commissionAmount: 0,
        status: 'COMPLETED',
        createdAt: new Date(),
        ...restData,
      };
      db.transactions.push(transaction);

      if (items?.create && Array.isArray(items.create)) {
        for (const item of items.create) {
          db.transactionItems.push({
            id: `txit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            transactionId: txId,
            quantity: 1,
            artistCommission: 0,
            ...item,
          });
        }
      }
      saveDb(db);

      const res: any = { ...transaction };
      if (args.include?.items) res.items = db.transactionItems.filter((i) => i.transactionId === txId);
      if (args.include?.customer) res.customer = db.customers.find((c) => c.id === transaction.customerId);
      if (args.include?.cashier) res.cashier = db.users.find((u) => u.id === transaction.cashierId);
      if (args.include?.artist) res.artist = db.users.find((u) => u.id === transaction.artistId);
      return res;
    },
    deleteMany: async () => {
      db.transactions = [];
      saveDb(db);
      return { count: 0 };
    },
  },

  transactionItem: {
    findMany: async (args?: { where?: any }) => {
      return db.transactionItems.filter((i) => matchesFilter(i, args?.where));
    },
    deleteMany: async () => {
      db.transactionItems = [];
      saveDb(db);
      return { count: 0 };
    },
  },
};

export default prisma;
