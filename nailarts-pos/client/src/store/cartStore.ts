import { create } from 'zustand';
import { CartItem, Customer, Service, ServiceAddon } from '../types';

interface CartState {
  items: CartItem[];
  selectedCustomer: Customer | null;
  selectedArtistId: string | null;
  selectedArtistName: string | null;
  discount: number; // in rupiah
  discountPercent: number;
  taxPercent: number; // e.g. 0% or 11%

  // Actions
  addItem: (service: Service, selectedAddons?: ServiceAddon[], artistId?: string, artistName?: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  setCustomer: (customer: Customer | null) => void;
  setArtist: (artistId: string | null, artistName: string | null) => void;
  setDiscount: (amount: number, percent?: number) => void;
  setTaxPercent: (tax: number) => void;
  clearCart: () => void;

  // Computed totals
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getTaxAmount: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  selectedCustomer: null,
  selectedArtistId: null,
  selectedArtistName: null,
  discount: 0,
  discountPercent: 0,
  taxPercent: 0,

  addItem: (service, selectedAddons = [], artistId, artistName) => {
    const addonsKey = selectedAddons.map(a => a.name).sort().join('|');
    const existingIndex = get().items.findIndex(
      it => it.serviceId === service.id &&
            it.addons.map(a => a.name).sort().join('|') === addonsKey &&
            it.artistId === (artistId || get().selectedArtistId)
    );

    if (existingIndex > -1) {
      const updated = [...get().items];
      updated[existingIndex].quantity += 1;
      set({ items: updated });
    } else {
      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        serviceId: service.id,
        serviceName: service.name,
        basePrice: service.basePrice,
        addons: selectedAddons,
        quantity: 1,
        artistId: artistId || get().selectedArtistId || undefined,
        artistName: artistName || get().selectedArtistName || undefined,
      };
      set({ items: [...get().items, newItem] });
    }
  },

  removeItem: (itemId) => {
    set({ items: get().items.filter(it => it.id !== itemId) });
  },

  updateQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }
    set({
      items: get().items.map(it => (it.id === itemId ? { ...it, quantity } : it)),
    });
  },

  setCustomer: (customer) => set({ selectedCustomer: customer }),
  setArtist: (artistId, artistName) => set({ selectedArtistId: artistId, selectedArtistName: artistName }),

  setDiscount: (amount, percent = 0) => set({ discount: amount, discountPercent: percent }),
  setTaxPercent: (taxPercent) => set({ taxPercent }),

  clearCart: () => set({
    items: [],
    selectedCustomer: null,
    discount: 0,
    discountPercent: 0,
    taxPercent: 0,
  }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => {
      const addonsTotal = item.addons.reduce((aSum, a) => aSum + a.price, 0);
      return sum + (item.basePrice + addonsTotal) * item.quantity;
    }, 0);
  },

  getDiscountAmount: () => {
    const subtotal = get().getSubtotal();
    const percent = get().discountPercent;
    if (percent > 0) {
      return Math.round((subtotal * percent) / 100);
    }
    return Math.min(get().discount, subtotal);
  },

  getTaxAmount: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscountAmount();
    const taxable = Math.max(0, subtotal - discount);
    const taxPercent = get().taxPercent;
    return taxPercent > 0 ? Math.round(taxable * (taxPercent / 100)) : 0;
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscountAmount();
    const tax = get().getTaxAmount();
    return Math.max(0, subtotal - discount + tax);
  },
}));
