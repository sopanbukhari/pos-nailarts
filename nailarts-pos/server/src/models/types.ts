export type RoleType = 'ADMIN' | 'OWNER_ADMIN' | 'CASHIER' | 'ARTIST';

export interface UserPayload {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  employeeId?: string;
}

export interface CartItemInput {
  itemType?: 'SERVICE' | 'PRODUCT';
  serviceId?: string;
  productId?: string;
  itemName: string;
  basePrice: number;
  addons?: { id?: string; name: string; price: number; extraMinutes?: number }[];
  quantity: number;
  artistId?: string;
}

export interface CheckoutInput {
  customerId?: string;
  cashierId: string;
  artistId?: string;
  appointmentId?: string;
  saleType?: 'WALK_IN' | 'APPOINTMENT';
  items: CartItemInput[];
  discount: number;
  discountCode?: string;
  tax: number;
  paymentMethod: 'CASH' | 'QRIS' | 'CARD' | 'BANK_TRANSFER' | 'SPLIT';
  downPaymentDeducted?: number;
  paymentDetails?: {
    cashAmount?: number;
    changeAmount?: number;
    cardRef?: string;
    qrisRef?: string;
    transferRef?: string;
    splitDetails?: { method: string; amount: number }[];
  };
  notes?: string;
}
