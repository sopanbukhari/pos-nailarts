import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  TrendingDown,
  Filter,
  Search,
  AlertCircle,
  Tag,
  Building,
  Zap,
  ShoppingBag,
  Users,
  Megaphone,
  Wrench,
  HelpCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { formatRupiah, formatDate } from '../../utils/format';
import { Expense } from '../../types';
import api from '../../lib/axios';

const CATEGORY_MAP: Record<string, { label: string; icon: any; color: string }> = {
  RENT: { label: 'Sewa Tempat & Studio', icon: Building, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  UTILITIES: { label: 'Listrik, Air & Wi-Fi', icon: Zap, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  SUPPLIES: { label: 'Bahan Baku & Perlengkapan', icon: ShoppingBag, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  SALARY: { label: 'Gaji Pokok & Uang Makan', icon: Users, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  MARKETING: { label: 'Iklan, Endorse & Promo', icon: Megaphone, color: 'bg-pink-50 text-pink-700 border-pink-200' },
  MAINTENANCE: { label: 'Perawatan Alat & Studio', icon: Wrench, color: 'bg-orange-50 text-orange-700 border-orange-200' },
  OTHER: { label: 'Lain-lain / Operasional', icon: HelpCircle, color: 'bg-slate-50 text-slate-700 border-slate-200' },
};

export const ExpensesView: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState('SUPPLIES');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExpenses();
  }, [selectedCategory]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const url = selectedCategory !== 'ALL' ? `/expenses?category=${selectedCategory}` : '/expenses';
      const res = await api.get(url);
      if (res.data.success) {
        setExpenses(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Nominal pengeluaran harus lebih besar dari 0.');
      return;
    }
    if (!description.trim()) {
      setError('Keterangan pengeluaran wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.post('/expenses', {
        category,
        amount: numAmount,
        date,
        description: description.trim(),
        receiptNumber: receiptNumber.trim() || undefined,
      });

      if (res.data.success) {
        setIsModalOpen(false);
        setAmount('');
        setDescription('');
        setReceiptNumber('');
        fetchExpenses();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan pengeluaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus catatan pengeluaran ini?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchExpenses();
    } catch (err) {
      console.error('Error deleting expense:', err);
    }
  };

  // Calculations
  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch =
      exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.receiptNumber && exp.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayExpense = expenses
    .filter((e) => e.date === todayStr)
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-1">
              Total Pengeluaran (Tercatat)
            </span>
            <span className="text-xl font-black text-rose-600">{formatRupiah(totalExpense)}</span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Dari {filteredExpenses.length} transaksi pengeluaran
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
            <TrendingDown size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-1">
              Pengeluaran Hari Ini
            </span>
            <span className="text-xl font-black text-slate-800">{formatRupiah(todayExpense)}</span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Tanggal: {formatDate(todayStr)}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Calendar size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-1">
              Kategori Pengeluaran
            </span>
            <span className="text-xl font-black text-slate-800">
              {Object.keys(CATEGORY_MAP).length} Kategori
            </span>
            <span className="text-[11px] text-emerald-600 font-medium block mt-1">
              Terintegrasi dengan Laporan Laba Rugi
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blush-50 text-blush-600 flex items-center justify-center">
            <Receipt size={24} />
          </div>
        </div>
      </div>

      {/* Action Bar & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari deskripsi / no. bukti..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blush-500/20"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="ALL">Semua Kategori</option>
            {Object.entries(CATEGORY_MAP).map(([key, info]) => (
              <option key={key} value={key}>
                {info.label}
              </option>
            ))}
          </select>
        </div>

        <Button
          variant="primary"
          size="md"
          className="flex items-center gap-2 shadow-sm"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={16} />
          <span>Catat Pengeluaran Baru</span>
        </Button>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-sm text-slate-800">Riwayat Pengeluaran Operasional</h3>
          <span className="text-xs text-slate-400">{filteredExpenses.length} Transaksi</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Keterangan / Keperluan</th>
                <th className="py-3 px-4">No. Bukti / Struk</th>
                <th className="py-3 px-4 text-right">Nominal (Rp)</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Memuat riwayat pengeluaran...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Belum ada catatan pengeluaran yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const catInfo = CATEGORY_MAP[exp.category] || CATEGORY_MAP.OTHER;
                  const Icon = catInfo.icon;
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap">
                        {formatDate(exp.date)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${catInfo.color}`}
                        >
                          <Icon size={12} />
                          <span>{catInfo.label}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 font-medium">{exp.description}</td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {exp.receiptNumber || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-rose-600">
                        -{formatRupiah(exp.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="text-slate-300 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Hapus Pengeluaran"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredExpenses.length > 0 && (
              <tfoot className="bg-slate-50/70 border-t border-slate-200 font-bold text-xs">
                <tr>
                  <td colSpan={4} className="py-3 px-4 text-slate-700 uppercase">
                    Total Keseluruhan Pengeluaran
                  </td>
                  <td className="py-3 px-4 text-right font-black text-rose-600 text-sm">
                    -{formatRupiah(totalExpense)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal Catat Pengeluaran Baru */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Catat Pengeluaran Baru"
        subtitle="Masukkan pengeluaran operasional studio salon nail art"
        maxWidth="md"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Kategori */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Kategori Pengeluaran:
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blush-500/20"
              required
            >
              {Object.entries(CATEGORY_MAP).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.label}
                </option>
              ))}
            </select>
          </div>

          {/* Nominal & Tanggal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nominal (Rp):
              </label>
              <input
                type="number"
                placeholder="Contoh: 150000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blush-500/20"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tanggal:
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                required
              />
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Keterangan Pengeluaran:
            </label>
            <textarea
              placeholder="Contoh: Beli 10 botol acetone remover & kapas nail pad di Pasar Baru"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blush-500/20"
              required
            />
          </div>

          {/* Nomor Bukti / Nota */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              No. Bukti / Kuitansi / Struk (Opsional):
            </label>
            <input
              type="text"
              placeholder="Contoh: NOTA-2026-0042 atau BUKTI-TF-01"
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blush-500/20"
            />
          </div>

          <div className="flex gap-2.5 pt-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
