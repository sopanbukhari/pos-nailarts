import React, { useState, useEffect } from 'react';
import {
  Package,
  AlertTriangle,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  History,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { InventoryItem, InventoryMovement } from '../../types';
import { formatRupiah, formatDate } from '../../utils/format';
import api from '../../lib/axios';

export const InventoryView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ITEMS' | 'MOVEMENTS'>('ITEMS');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [search, setSearch] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMovements, setLoadingMovements] = useState(false);

  // Stock adjustment modal state
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [movementType, setMovementType] = useState<'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT'>('STOCK_IN');
  const [quantityInput, setQuantityInput] = useState<number>(5);
  const [movementNotes, setMovementNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // New item modal
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemSku, setNewItemSku] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Gel Polish');
  const [newItemQty, setNewItemQty] = useState(10);
  const [newItemUnit, setNewItemUnit] = useState('botol');
  const [newItemCost, setNewItemCost] = useState(75000);
  const [newItemRetail, setNewItemRetail] = useState(120000);
  const [newItemMinAlert, setNewItemMinAlert] = useState(5);

  useEffect(() => {
    fetchInventory();
  }, [onlyLowStock]);

  useEffect(() => {
    if (activeTab === 'MOVEMENTS') {
      fetchMovements();
    }
  }, [activeTab]);

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

  const fetchMovements = async () => {
    setLoadingMovements(true);
    try {
      const res = await api.get('/inventory/movements?limit=100');
      if (res.data.success) {
        setMovements(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMovements(false);
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setIsSubmitting(true);
    setActionError(null);

    try {
      let change = Number(quantityInput);
      if (movementType === 'STOCK_OUT') {
        change = -Math.abs(change);
      }

      await api.patch(`/inventory/${selectedItem.id}/stock`, {
        quantityChange: change,
        movementType,
        notes: movementNotes.trim() || undefined,
      });

      setSelectedItem(null);
      setQuantityInput(5);
      setMovementNotes('');
      fetchInventory();
      if (activeTab === 'MOVEMENTS') fetchMovements();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Gagal memperbarui stok.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/inventory', {
        name: newItemName,
        sku: newItemSku,
        category: newItemCategory,
        stockQuantity: Number(newItemQty),
        unit: newItemUnit,
        costPrice: Number(newItemCost),
        retailPrice: Number(newItemRetail),
        minStockAlert: Number(newItemMinAlert),
      });

      setIsNewItemModalOpen(false);
      setNewItemName('');
      setNewItemSku('');
      fetchInventory();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menambahkan produk baru.');
    } finally {
      setIsSubmitting(false);
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
            <span className="text-xs text-slate-400 block font-medium">Total Item Inventaris</span>
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
            <span className="text-xs text-slate-400 block font-medium">Integrasi Transaksi POS</span>
            <span className="text-lg font-black text-emerald-700">Auto-Deduction Aktif</span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Stok vs Mutasi */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('ITEMS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ITEMS'
              ? 'bg-blush-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package size={15} />
          <span>Daftar Stok & Barang ({items.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('MOVEMENTS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'MOVEMENTS'
              ? 'bg-blush-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History size={15} />
          <span>Riwayat Mutasi & Pergerakan Stok</span>
        </button>
      </div>

      {activeTab === 'ITEMS' ? (
        <>
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
              <span>Tambah Produk / Barang Baru</span>
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
                    <th className="py-3 px-4">Harga Jual (Retail)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Memuat data inventaris...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Tidak ada barang inventaris yang sesuai.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => {
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
                          <td className="py-3 px-4 font-bold text-blush-700">
                            {item.retailPrice ? formatRupiah(item.retailPrice) : '-'}
                          </td>
                          <td className="py-3 px-4">
                            {isLow ? (
                              <Badge variant="rose">Menipis (≤{item.minStockAlert})</Badge>
                            ) : (
                              <Badge variant="emerald">Stok Aman</Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                setSelectedItem(item);
                                setMovementType('STOCK_IN');
                                setQuantityInput(5);
                                setMovementNotes('');
                                setActionError(null);
                              }}
                            >
                              Mutasi Stok
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Movements Table */
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-800">Log Mutasi & Perpindahan Stok Fisik</h3>
            <span className="text-xs text-slate-400">{movements.length} Catatan Terakhir</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Barang / SKU</th>
                  <th className="py-3 px-4">Tipe Mutasi</th>
                  <th className="py-3 px-4 text-center">Perubahan</th>
                  <th className="py-3 px-4 text-center">Stok Sebelum → Sesudah</th>
                  <th className="py-3 px-4">No. Ref / Bukti</th>
                  <th className="py-3 px-4">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingMovements ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Memuat riwayat pergerakan stok...
                    </td>
                  </tr>
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Belum ada catatan mutasi stok.
                    </td>
                  </tr>
                ) : (
                  movements.map((mov) => {
                    const isPositive = mov.quantity > 0;
                    return (
                      <tr key={mov.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(mov.createdAt).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-800 block">
                            {mov.product?.name || 'Produk'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {mov.product?.sku}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              mov.movementType === 'STOCK_IN'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : mov.movementType === 'STOCK_OUT'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : mov.movementType === 'SALE_DEDUCTION'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}
                          >
                            {mov.movementType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-black ${
                              isPositive ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isPositive ? `+${mov.quantity}` : mov.quantity}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-600">
                          {mov.beforeQuantity} → <strong className="text-slate-900">{mov.afterQuantity}</strong>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {mov.referenceNumber || '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                          {mov.notes || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        title="Mutasi & Penyesuaian Stok"
        subtitle={selectedItem ? `${selectedItem.name} (${selectedItem.sku})` : ''}
        maxWidth="md"
      >
        <form onSubmit={handleStockAdjustment} className="space-y-4">
          {actionError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{actionError}</span>
            </div>
          )}

          {/* Current Stock Banner */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-600">Stok Saat Ini di Sistem:</span>
            <span className="text-base font-black text-slate-900">
              {selectedItem?.stockQuantity} {selectedItem?.unit}
            </span>
          </div>

          {/* Movement Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Jenis Mutasi:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMovementType('STOCK_IN')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  movementType === 'STOCK_IN'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <ArrowDownLeft size={14} className="text-emerald-600" />
                <span>Barang Masuk (+)</span>
              </button>

              <button
                type="button"
                onClick={() => setMovementType('STOCK_OUT')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  movementType === 'STOCK_OUT'
                    ? 'bg-rose-50 border-rose-400 text-rose-800'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <ArrowUpRight size={14} className="text-rose-600" />
                <span>Barang Keluar (-)</span>
              </button>

              <button
                type="button"
                onClick={() => setMovementType('ADJUSTMENT')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  movementType === 'ADJUSTMENT'
                    ? 'bg-purple-50 border-purple-400 text-purple-800'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <SlidersHorizontal size={14} className="text-purple-600" />
                <span>Opname Fisik</span>
              </button>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Jumlah ({selectedItem?.unit}):
            </label>
            <input
              type="number"
              value={quantityInput}
              onChange={(e) => setQuantityInput(Number(e.target.value))}
              min={1}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blush-500/20"
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Alasan / Keterangan Mutasi:
            </label>
            <input
              type="text"
              placeholder="Contoh: Pembelian stok baru supplier / Pemakaian 4 botol di studio"
              value={movementNotes}
              onChange={(e) => setMovementNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setSelectedItem(null)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Memproses...' : 'Simpan Mutasi'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* New Item Modal */}
      <Modal
        isOpen={isNewItemModalOpen}
        onClose={() => setIsNewItemModalOpen(false)}
        title="Tambah Produk / Perlengkapan Baru"
        subtitle="Daftarkan SKU barang operasional atau produk retail salon"
        maxWidth="md"
      >
        <form onSubmit={handleCreateNewItem} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Produk / Bahan:
            </label>
            <input
              type="text"
              placeholder="Contoh: Kuteks Gel Pastel Lilac 15ml"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blush-500/20"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kode SKU:
              </label>
              <input
                type="text"
                placeholder="Contoh: GEL-LILAC-01"
                value={newItemSku}
                onChange={(e) => setNewItemSku(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kategori:
              </label>
              <input
                type="text"
                placeholder="Contoh: Gel Polish, Cuticle Care..."
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Harga Modal (Cost):
              </label>
              <input
                type="number"
                value={newItemCost}
                onChange={(e) => setNewItemCost(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Harga Jual Retail (POS):
              </label>
              <input
                type="number"
                value={newItemRetail}
                onChange={(e) => setNewItemRetail(Number(e.target.value))}
                placeholder="0 jika bukan retail"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-blush-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Stok Awal:
              </label>
              <input
                type="number"
                value={newItemQty}
                onChange={(e) => setNewItemQty(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Satuan Unit:
              </label>
              <input
                type="text"
                value={newItemUnit}
                onChange={(e) => setNewItemUnit(e.target.value)}
                placeholder="botol, pcs, box"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Batas Alert:
              </label>
              <input
                type="number"
                value={newItemMinAlert}
                onChange={(e) => setNewItemMinAlert(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
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
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Produk Baru'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
