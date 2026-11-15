export type RoleType = 'ADMIN' | 'CASHIER' | 'ARTIST';

export interface User {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  phone?: string;
  commissionRate?: number;
  employeeId?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  nailShapePreference?: string;
  colorPreferences?: string;
  allergies?: string;
  loyaltyPoints: number;
  createdAt: string;
}

export interface ServiceAddon {
  id: string;
  serviceId?: string;
  name: string;
  price: number;
  extraMinutes: number;
}

export interface Service {
  id: string;
  name: string;
  categoryId: string;
  category?: Category;
  basePrice: number;
  durationMinutes: number;
  description?: string;
  image?: string;
  commissionRate?: number;
  isActive: boolean;
  addons?: ServiceAddon[];
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  services?: Service[];
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  description?: string;
  retailPrice: number;
  costPrice: number;
  stockQuantity: number;
  minStockAlert: number;
  unit: string;
  isActive: boolean;
  updatedAt?: string;
}

export type InventoryItem = Product;

export interface CartItem {
  id: string; // Unique cart line ID
  itemType?: 'SERVICE' | 'PRODUCT';
  serviceId?: string;
  productId?: string;
  serviceName: string;
  basePrice: number;
  addons: ServiceAddon[];
  quantity: number;
  artistId?: string;
  artistName?: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  product?: { name: string; sku: string; unit: string };
  movementType: 'STOCK_IN' | 'STOCK_OUT' | 'SALE_DEDUCTION' | 'ADJUSTMENT';
  quantity: number;
  beforeQuantity: number;
  afterQuantity: number;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  customerId: string;
  customer: Customer;
  artistId: string;
  artist: { id: string; employeeId?: string; name: string; phone?: string };
  date: string;
  startTime: string;
  endTime: string;
  totalDuration?: number;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
  totalPrice: number;
  downPaymentAmount?: number;
  items: Array<{
    id: string;
    serviceId?: string;
    service: Service;
    price: number;
    durationMinutes?: number;
  }>;
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customer?: Customer;
  cashierId: string;
  cashier: { id: string; name: string };
  artistId?: string;
  artist?: { id: string; name: string };
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  downPaymentDeducted?: number;
  remainingAmount?: number;
  paymentMethod: 'CASH' | 'QRIS' | 'CARD' | 'BANK_TRANSFER' | 'TRANSFER' | 'SPLIT';
  paymentDetailsJson?: string;
  commissionAmount: number;
  status: 'PAID' | 'COMPLETED' | 'REFUNDED' | 'CANCELLED';
  createdAt: string;
  items: Array<{
    id: string;
    itemType?: 'SERVICE' | 'PRODUCT';
    serviceName: string;
    itemName?: string;
    basePrice: number;
    addonsJson?: string;
    quantity: number;
    totalPrice: number;
    artistCommission: number;
  }>;
}

export interface Expense {
  id: string;
  category: 'RENT' | 'UTILITIES' | 'SUPPLIES' | 'SALARY' | 'MARKETING' | 'MAINTENANCE' | 'OTHER';
  date: string;
  description: string;
  amount: number;
  receiptNumber?: string;
  receiptImage?: string;
  createdByUser?: { id: string; name: string };
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  user?: { name: string; email: string };
  action: string;
  entity: string;
  entityId?: string;
  newValuesJson?: string;
  createdAt: string;
}
