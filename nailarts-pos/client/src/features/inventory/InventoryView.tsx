import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, Plus, Search, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { InventoryItem } from '../../types';
import { formatRupiah } from '../../utils/format';
import api from '../../lib/axios';

export const InventoryView: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [loading, setLoading] = useState(true);

  // Restock modal state
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New item modal
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemSku, setNewItemSku] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Gel Polish');
  const [newItemQty, setNewItemQty] = useState(10);
  const [newItemUnit, setNewItemUnit] = useState('botol');
  const [newItemCost, setNewItemCost] = useState(75000);

  useEffect(() => {
    fetchInventory();
  }, [onlyLowStock]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/inventory${onlyLowStock ? '?lowStock=true' : ''}`);
      if (res.data.success) {
        setItems(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestock = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/inventory/${selectedItem.id}/stock`, {
        quantityChange: restockQty,
      });
      setSelectedItem(null);
      fetchInventory();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/inventory', {
        name: newItemName,
        sku: newItemSku,
        category: newItemCategory,
        stockQuantity: newItemQty,
        unit: newItemUnit,
        costPrice: newItemCost,
      });
      setIsNewItemModalOpen(false);
      setNewItemName('');
      setNewItemSku('');
      fetchInventory();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = items.filter(
    (it) =>
      it.name.toLowerCase().includes(search.toLowerCase()) ||
      it.sku.toLowerCase().includes(search.toLowerCase()) ||
      it.category.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = items.filter((it) => it.stockQuantity <= it.minStockAlert).length;

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-blush-600 flex items-center justify-center font-bold">
            <Package size={20} />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Total Item Perlengkapan</span>
            <span className="text-lg font-black text-slate-800">{items.length} SKUs</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertTriangle size={20} />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Peringatan Stok Menipis</span>
            <span className="text-lg font-black text-amber-600">{lowStockCount} Item Menipis</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Status Pengadaan</span>
            <span className="text-lg font-black text-emerald-700">Tersinkronisasi POS</span>
          </div>
        </div>
      </div>

      {/* Filter and Table Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama kuteks, gel, alat steril, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blush-500/20"
            />
          </div>

          <button
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              onlyLowStock
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle size={14} />
            <span>Hanya Stok Menipis ({lowStockCount})</span>
          </button>
        </div>

        <Button
          variant="primary"
          size="md"
          className="flex items-center gap-2"
          onClick={() => setIsNewItemModalOpen(true)}
        >
          <Plus size={16} />
          <span>Tambah Barang Masuk</span>
        </Button>
      </div>

      {/* Table Items */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">SKU / Kode</th>
                <th className="py-3 px-4">Nama Barang</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Sisa Stok</th>
                <th className="py-3 px-4">Harga Beli</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => {
                const isLow = item.stockQuantity <= item.minStockAlert;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-600">{item.sku}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{item.name}</td>
                    <td className="py-3 px-4 text-slate-500">{item.category}</td>
                    <td className="py-3 px-4">
                      <span className="font-extrabold text-sm text-slate-900">{item.stockQuantity}</span>{' '}
                      <span className="text-slate-400 text-[11px]">{item.unit}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {formatRupiah(item.costPrice)}
                    </td>
                    <td className="py-3 px-4">
                      {isLow ? (
                        <Badge variant="rose">Stok Menipis (≤{item.minStockAlert})</Badge>
                      ) : (
                        <Badge variant="emerald">Stok Aman</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-xs"
                        onClick={() => setSelectedItem(item)}
                      >
                        + Restock
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restock Modal */}
      <Modal
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        title="Restock Barang Inventaris"
        subtitle={selectedItem ? `${selectedItem.name} (${selectedItem.sku})` : ''}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tambah Jumlah Stok ({selectedItem?.unit}):
            </label>
            <input
              type="number"
              value={restockQty}
              onChange={(e) => setRestockQty(Number(e.target.value))}
              min={1}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setSelectedItem(null)}>
              Batal
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleRestock}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Memproses...' : 'Konfirmasi Restock'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* New Item Modal */}
      <Modal
        isOpen={isNewItemModalOpen}
        onClose={() => setIsNewItemModalOpen(false)}
        title="Daftarkan Barang Baru"
        subtitle="Kuteks, gel, hiasan kuku atau perlengkapan salon"
        maxWidth="md"
      >
        <form onSubmit={handleCreateNewItem} className="space-y-4">
          <Input
            label="Nama Barang / Kuteks"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Contoh: Gelish Matte Top Coat 15ml"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="SKU / Barcode"
              value={newItemSku}
              onChange={(e) => setNewItemSku(e.target.value)}
              placeholder="Contoh: POL-042"
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Kategori:
              </label>
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
              >
                <option value="Gel Polish">Gel Polish</option>
                <option value="Coating">Coating (Base / Top)</option>
                <option value="Tips & Extension">Tips & Extension</option>
                <option value="Accessories">Aksesoris & Kristal 3D</option>
                <option value="Tools">Tools & Drill Bits</option>
                <option value="Sanitizing">Sterilisasi & Aseton</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Jumlah Awal:
              </label>
              <input
                type="number"
                value={newItemQty}
                onChange={(e) => setNewItemQty(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Satuan:
              </label>
              <input
                type="text"
                value={newItemUnit}
                onChange={(e) => setNewItemUnit(e.target.value)}
                placeholder="botol/pcs/box"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Harga Beli (Rp):
              </label>
              <input
                type="number"
                value={newItemCost}
                onChange={(e) => setNewItemCost(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                required
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsNewItemModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              Simpan Barang
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
