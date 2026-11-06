import React, { useState } from 'react';
import {
  Trash2,
  Plus,
  Minus,
  User,
  Tag,
  Percent,
  Receipt,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { Customer, User as StaffUser } from '../../types';
import { formatRupiah } from '../../utils/format';
import { Button } from '../../components/ui/Button';

interface CartPanelProps {
  customers: Customer[];
  artists: StaffUser[];
  onOpenCustomerModal: () => void;
  onProceedCheckout: () => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({
  customers,
  artists,
  onOpenCustomerModal,
  onProceedCheckout,
}) => {
  const {
    items,
    selectedCustomer,
    selectedArtistId,
    selectedArtistName,
    discountPercent,
    taxPercent,
    removeItem,
    updateQuantity,
    setCustomer,
    setArtist,
    setDiscount,
    setTaxPercent,
    clearCart,
    getSubtotal,
    getDiscountAmount,
    getTaxAmount,
    getTotal,
  } = useCartStore();

  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [customDiscountPercent, setCustomDiscountPercent] = useState<number>(0);

  const subtotal = getSubtotal();
  const discountAmount = getDiscountAmount();
  const taxAmount = getTaxAmount();
  const total = getTotal();

  const handleApplyDiscount = (pct: number) => {
    setCustomDiscountPercent(pct);
    setDiscount(0, pct);
    setShowDiscountInput(false);
  };

  return (
    <div className="w-96 bg-white border border-slate-200/80 rounded-2xl flex flex-col h-[calc(100vh-6.5rem)] shadow-sm">
      {/* Customer Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Pelanggan (Customer)
          </span>
          <button
            onClick={onOpenCustomerModal}
            className="text-xs font-semibold text-blush-600 hover:text-blush-700 cursor-pointer"
          >
            {selectedCustomer ? 'Ganti' : '+ Pilih / Baru'}
          </button>
        </div>

        {selectedCustomer ? (
          <div className="p-2.5 rounded-xl bg-white border border-rose-100 flex items-center justify-between shadow-2xs">
            <div>
              <p className="text-xs font-bold text-slate-800">{selectedCustomer.name}</p>
              <p className="text-[11px] text-slate-500">{selectedCustomer.phone}</p>
              {selectedCustomer.nailShapePreference && (
                <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">
                  💅 {selectedCustomer.nailShapePreference}
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Poin Member</span>
              <span className="text-xs font-bold text-amber-600">
                ⭐ {selectedCustomer.loyaltyPoints} pts
              </span>
            </div>
          </div>
        ) : (
          <button
            onClick={onOpenCustomerModal}
            className="w-full py-2.5 px-3 border border-dashed border-slate-300 rounded-xl text-xs text-slate-500 hover:border-blush-400 hover:text-blush-600 flex items-center justify-center gap-2 bg-white transition-all cursor-pointer"
          >
            <User size={14} />
            <span>Pilih Pelanggan / Pelanggan Baru</span>
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-400 mb-3">
              <Sparkles size={24} />
            </div>
            <p className="text-sm font-semibold text-slate-700">Keranjang Masih Kosong</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              Klik layanan di katalog sebelah kiri untuk memasukkan ke keranjang kasir.
            </p>
          </div>
        ) : (
          items.map((item) => {
            const addonsTotal = item.addons.reduce((sum, a) => sum + a.price, 0);
            const lineTotal = (item.basePrice + addonsTotal) * item.quantity;

            return (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-slate-100 bg-white shadow-2xs space-y-2 hover:border-slate-200 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="pr-2">
                    <h4 className="text-xs font-bold text-slate-800 leading-snug">{item.serviceName}</h4>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {formatRupiah(item.basePrice)}
                    </span>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-slate-300 hover:text-rose-500 p-1 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Add-ons List */}
                {item.addons && item.addons.length > 0 && (
                  <div className="pl-2 border-l-2 border-rose-200 space-y-0.5">
                    {item.addons.map((a, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] text-slate-500">
                        <span>+ {a.name}</span>
                        <span>{formatRupiah(a.price)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Assigned Artist */}
                {item.artistName && (
                  <div className="text-[10px] text-blush-700 font-medium bg-rose-50/70 px-2 py-0.5 rounded-md inline-block">
                    💅 Artist: {item.artistName}
                  </div>
                )}

                {/* Quantity and Subtotal */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 hover:bg-slate-200 text-slate-600 transition-colors"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="px-2.5 text-xs font-bold text-slate-800">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 hover:bg-slate-200 text-slate-600 transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <span className="text-xs font-bold text-slate-900">{formatRupiah(lineTotal)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cart Summary & Checkout */}
      {items.length > 0 && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 space-y-3 rounded-b-2xl">
          {/* Quick Discount & Tax Options */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowDiscountInput(!showDiscountInput)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-blush-400 font-medium"
              >
                <Tag size={12} />
                <span>Diskon {discountPercent > 0 ? `(${discountPercent}%)` : ''}</span>
              </button>
              <button
                onClick={() => setTaxPercent(taxPercent === 0 ? 11 : 0)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border font-medium ${
                  taxPercent > 0
                    ? 'bg-rose-50 border-blush-400 text-blush-700'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <span>PPN 11%</span>
              </button>
            </div>
            <button
              onClick={clearCart}
              className="text-[11px] font-semibold text-rose-500 hover:text-rose-700"
            >
              Reset
            </button>
          </div>

          {/* Discount presets modal/bar */}
          {showDiscountInput && (
            <div className="p-2.5 bg-white rounded-xl border border-rose-200 shadow-sm flex items-center gap-1.5 animate-in fade-in">
              <span className="text-[11px] font-semibold text-slate-500">Pilih %:</span>
              {[5, 10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  onClick={() => handleApplyDiscount(pct)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                    discountPercent === pct
                      ? 'bg-blush-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {pct}%
                </button>
              ))}
              <button
                onClick={() => handleApplyDiscount(0)}
                className="ml-auto text-[11px] text-slate-400 hover:text-slate-600"
              >
                Hapus
              </button>
            </div>
          )}

          {/* Calculation Breakdown */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{formatRupiah(subtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Diskon ({discountPercent}%)</span>
                <span>-{formatRupiah(discountAmount)}</span>
              </div>
            )}

            {taxAmount > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Pajak (11%)</span>
                <span>+{formatRupiah(taxAmount)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200/70 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-800">Total Akhir</span>
              <span className="text-lg font-black text-blush-600">{formatRupiah(total)}</span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full py-3 shadow-md shadow-blush-200"
            onClick={onProceedCheckout}
          >
            Bayar / Checkout ({items.length} item)
          </Button>
        </div>
      )}
    </div>
  );
};
