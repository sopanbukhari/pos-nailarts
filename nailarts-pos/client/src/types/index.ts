export type RoleType = 'ADMIN' | 'CASHIER' | 'ARTIST';

export interface User {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  phone?: string;
  commissionRate?: number;
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

export interface CartItem {
  id: string; // Unique cart line ID
  serviceId: string;
  serviceName: string;
  basePrice: number;
  addons: ServiceAddon[];
  quantity: number;
  artistId?: string;
  artistName?: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  stockQuantity: number;
  unit: string;
  minStockAlert: number;
  costPrice: number;
  supplier?: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  customerId: string;
  customer: Customer;
  artistId: string;
  artist: { id: string; name: string; phone?: string };
  date: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  totalPrice: number;
  items: Array<{
    id: string;
    service: Service;
    addonNamesJson?: string;
    price: number;
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
  paymentMethod: 'CASH' | 'QRIS' | 'CARD' | 'SPLIT';
  paymentDetailsJson?: string;
  commissionAmount: number;
  status: 'COMPLETED' | 'REFUNDED';
  createdAt: string;
  items: Array<{
    id: string;
    serviceName: string;
    basePrice: number;
    addonsJson?: string;
    quantity: number;
    totalPrice: number;
    artistCommission: number;
  }>;
}
