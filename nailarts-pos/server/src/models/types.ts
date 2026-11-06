export type RoleType = 'ADMIN' | 'CASHIER' | 'ARTIST';

export interface UserPayload {
  id: string;
  name: string;
  email: string;
  role: RoleType;
}

export interface CartItemInput {
  serviceId: string;
  serviceName: string;
  basePrice: number;
  addons?: { id?: string; name: string; price: number; extraMinutes?: number }[];
  quantity: number;
  artistId?: string;
}

export interface CheckoutInput {
  customerId?: string;
  cashierId: string;
  artistId?: string;
  items: CartItemInput[];
  discount: number;
  tax: number;
  paymentMethod: 'CASH' | 'QRIS' | 'CARD' | 'SPLIT';
  paymentDetails?: {
    cashAmount?: number;
    changeAmount?: number;
    cardRef?: string;
    qrisRef?: string;
    splitDetails?: { method: string; amount: number }[];
  };
}
