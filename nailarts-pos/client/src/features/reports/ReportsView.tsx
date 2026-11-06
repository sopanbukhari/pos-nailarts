import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Receipt,
  Users,
  Award,
  Calendar,
  Sparkles,
  MessageCircle,
  Download,
  Printer,
  FileSpreadsheet,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatDate, formatRupiah } from '../../utils/format';
import { ReceiptModal } from '../pos/ReceiptModal';
import { Transaction } from '../../types';
import api from '../../lib/axios';

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export const ReportsView: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [topServices, setTopServices] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  // State untuk Laporan Omzet Berdasarkan Periode
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('daily');
  const [revenueReport, setRevenueReport] = useState<any>(null);
  const [loadingPeriod, setLoadingPeriod] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchRevenuePeriod(selectedPeriod);
  }, [selectedPeriod]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [sumRes, topRes, txRes] = await Promise.all([
        api.get('/reports/summary'),
        api.get('/reports/top-services'),
        api.get('/pos/transactions?limit=10'),
      ]);

      if (sumRes.data.success) setSummary(sumRes.data.data);
      if (topRes.data.success) setTopServices(topRes.data.data);
      if (txRes.data.success) setRecentTransactions(txRes.data.data);
    } catch (err) {
      console.error('Error fetching initial report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenuePeriod = async (period: ReportPeriod) => {
    setLoadingPeriod(true);
    try {
      const res = await api.get(`/reports/revenue?period=${period}`);
      if (res.data.success) {
        setRevenueReport(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching period revenue:', err);
    } finally {
      setLoadingPeriod(false);
    }
  };

  /**
   * Unduh Laporan Omzet ke Format CSV / Excel
   */
  const handleDownloadCSV = () => {
    if (!revenueReport || !revenueReport.rows || revenueReport.rows.length === 0) {
      alert('Tidak ada data laporan untuk diunduh.');
      return;
    }

    const periodName = {
      daily: 'Harian_14Hari',
      weekly: 'Mingguan_8Minggu',
      monthly: 'Bulanan_1Tahun',
      yearly: 'Tahunan_5Tahun',
    }[selectedPeriod];

    let csvContent = '\uFEFF'; // BOM UTF-8 agar Excel membaca karakter & mata uang dengan benar
    csvContent += `LAPORAN OMZET & KINERJA KEUANGAN SALON\n`;
    csvContent += `NailArt Studio Salon - Senopati Raya, Jakarta Selatan\n`;
    csvContent += `Periode: ${selectedPeriod.toUpperCase()} | Waktu Export: ${new Date().toLocaleString('id-ID')}\n\n`;

    // Kolom Header
    csvContent += 'Periode / Tanggal,Jml Transaksi,Subtotal (Rp),Diskon (Rp),PPN (Rp),Total Omzet (Rp),Komisi Artist (Rp),Net Salon (Rp)\n';

    // Baris Data
    revenueReport.rows.forEach((row: any) => {
      csvContent += `"${row.label}",${row.txCount},${row.subtotal},${row.discount},${row.tax},${row.revenue},${row.commission},${row.netRevenue}\n`;
    });

    // Baris Ringkasan Total
    const s = revenueReport.summary;
    csvContent += `\n"TOTAL KESELURUHAN",${s.totalTransactions},${s.totalSubtotal},${s.totalDiscount},${s.totalTax},${s.totalRevenue},${s.totalCommission},${s.netRevenue}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Omzet_${periodName}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const maxRevenue = Math.max(
    ...(revenueReport?.rows?.map((d: any) => d.revenue) || [1000000]),
    100000
  );

  return (
    <div className="space-y-6">
      {/* KPI Cards Row (Ringkasan Cepat) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Omzet Hari Ini</span>
            <div className="w-8 h-8 rounded-xl bg-blush-50 text-blush-600 flex items-center justify-center font-bold">
              <TrendingUp size={16} />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-900 block">
            {formatRupiah(summary?.today?.omzet || 0)}
          </span>
          <span className="text-xs text-slate-400 mt-1 block">
            {summary?.today?.transactionCount || 0} transaksi selesai hari ini
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Omzet Keseluruhan</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign size={16} />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-900 block">
            {formatRupiah(summary?.overall?.totalOmzet || 0)}
          </span>
          <span className="text-xs text-emerald-600 font-semibold mt-1 block">
            Net Salon: {formatRupiah(summary?.overall?.netRevenue || 0)}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Komisi Artist</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Award size={16} />
            </div>
          </div>
          <span className="text-2xl font-black text-rose-600 block">
            {formatRupiah(summary?.overall?.totalCommissionPayout || 0)}
          </span>
          <span className="text-xs text-slate-400 mt-1 block">
            Hak komisi pengerjaan nail artists
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pelanggan Terdaftar</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users size={16} />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-900 block">
            {summary?.overall?.totalCustomers || 0} Pelanggan
          </span>
          <span className="text-xs text-indigo-600 font-semibold mt-1 block">
            {summary?.overall?.pendingBookings || 0} booking aktif
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SEKSI UTAMA: LAPORAN OMZET (Harian, Mingguan, Bulanan, Tahunan) */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Header Seksi & Kontrol Filter */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blush-100 text-blush-700 flex items-center justify-center">
                <BarChart3 size={16} />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">Laporan Omzet & Pendapatan Salon</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Analisis performa finansial berdasarkan rentang waktu yang fleksibel
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Tab Pilihan Periode */}
            <div className="inline-flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setSelectedPeriod('daily')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedPeriod === 'daily'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Harian
              </button>
              <button
                type="button"
                onClick={() => setSelectedPeriod('weekly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedPeriod === 'weekly'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mingguan
              </button>
              <button
                type="button"
                onClick={() => setSelectedPeriod('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedPeriod === 'monthly'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bulanan
              </button>
              <button
                type="button"
                onClick={() => setSelectedPeriod('yearly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedPeriod === 'yearly'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tahunan
              </button>
            </div>

            {/* Tombol Unduh Laporan */}
            <button
              type="button"
              onClick={handleDownloadCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs active:scale-95"
              title="Unduh data laporan ke format Excel / CSV"
            >
              <Download size={14} />
              <span>Download Excel / CSV</span>
            </button>
          </div>
        </div>

        {/* Mini Summary Cards Khusus Periode Terpilih */}
        {revenueReport?.summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 bg-slate-50/70 border-b border-slate-100 divide-x divide-slate-100">
            <div className="p-4">
              <span className="text-[11px] font-semibold text-slate-500 block">Omzet Periode Ini</span>
              <span className="text-lg font-black text-slate-900 block mt-0.5">
                {formatRupiah(revenueReport.summary.totalRevenue)}
              </span>
              <span className="text-[10px] text-slate-400">Total kotor setelah diskon & pajak</span>
            </div>
            <div className="p-4">
              <span className="text-[11px] font-semibold text-slate-500 block">Total Transaksi</span>
              <span className="text-lg font-black text-slate-900 block mt-0.5">
                {revenueReport.summary.totalTransactions} Transaksi
              </span>
              <span className="text-[10px] text-slate-400">Rata-rata: {formatRupiah(revenueReport.summary.averagePerTx)} / tx</span>
            </div>
            <div className="p-4">
              <span className="text-[11px] font-semibold text-slate-500 block">Komisi Artis Dibayarkan</span>
              <span className="text-lg font-black text-rose-600 block mt-0.5">
                {formatRupiah(revenueReport.summary.totalCommission)}
              </span>
              <span className="text-[10px] text-slate-400">Bagi hasil pengerjaan treatment</span>
            </div>
            <div className="p-4">
              <span className="text-[11px] font-semibold text-slate-500 block">Pendapatan Bersih (Net)</span>
              <span className="text-lg font-black text-emerald-600 block mt-0.5">
                {formatRupiah(revenueReport.summary.netRevenue)}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">Laba bersih pemilik salon</span>
            </div>
          </div>
        )}

        {/* Visual Bar Chart Omzet */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Grafik Tren Penjualan ({selectedPeriod.toUpperCase()})
            </h4>
            <span className="text-[11px] text-slate-400">Arahkan kursor ke batang grafik untuk detail</span>
          </div>

          <div className="h-60 flex items-end justify-between gap-2 sm:gap-3 pt-6 pb-2">
            {revenueReport?.rows?.map((d: any, idx: number) => {
              const heightPct = Math.max(8, Math.round((d.revenue / maxRevenue) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="text-[10px] font-bold text-slate-600">
                    {d.revenue > 0 ? (d.revenue >= 1000000 ? `${(d.revenue / 1000000).toFixed(1)}M` : `${Math.round(d.revenue / 1000)}k`) : '0'}
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[48px] bg-gradient-to-t from-blush-600 to-rose-400 rounded-t-xl hover:from-blush-700 hover:to-rose-500 transition-all cursor-pointer relative group shadow-xs"
                  >
                    {/* Tooltip Hover */}
                    <div className="hidden group-hover:block absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] p-2 rounded-lg whitespace-nowrap z-20 shadow-lg pointer-events-none text-left">
                      <p className="font-bold border-b border-slate-700 pb-1 mb-1">{d.label}</p>
                      <p>Omzet: <span className="font-bold text-rose-300">{formatRupiah(d.revenue)}</span></p>
                      <p>Transaksi: <span className="font-bold">{d.txCount} tx</span></p>
                      <p>Komisi: <span className="font-bold text-amber-300">{formatRupiah(d.commission)}</span></p>
                      <p>Net: <span className="font-bold text-emerald-300">{formatRupiah(d.netRevenue)}</span></p>
                    </div>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 truncate max-w-full text-center">
                    {d.label.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabel Rincian Data Omzet */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Periode / Tanggal</th>
                <th className="py-3 px-4 text-center">Jml Transaksi</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Diskon</th>
                <th className="py-3 px-4 text-right">PPN (11%)</th>
                <th className="py-3 px-4 text-right font-black">Total Omzet</th>
                <th className="py-3 px-4 text-right text-rose-700">Komisi Artist</th>
                <th className="py-3 px-4 text-right text-emerald-700 font-bold">Net Salon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {revenueReport?.rows?.map((row: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-800">{row.label}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-700">
                      {row.txCount} tx
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600">{formatRupiah(row.subtotal)}</td>
                  <td className="py-3 px-4 text-right text-rose-600">
                    {row.discount > 0 ? `-${formatRupiah(row.discount)}` : '-'}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600">
                    {row.tax > 0 ? `+${formatRupiah(row.tax)}` : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-slate-900">{formatRupiah(row.revenue)}</td>
                  <td className="py-3 px-4 text-right font-semibold text-rose-700">{formatRupiah(row.commission)}</td>
                  <td className="py-3 px-4 text-right font-black text-emerald-700">{formatRupiah(row.netRevenue)}</td>
                </tr>
              ))}
            </tbody>
            {/* Total Footer */}
            {revenueReport?.summary && (
              <tfoot className="bg-slate-100/80 font-black text-xs border-t-2 border-slate-300">
                <tr>
                  <td className="py-3 px-4 text-slate-900 uppercase">TOTAL ({selectedPeriod})</td>
                  <td className="py-3 px-4 text-center">{revenueReport.summary.totalTransactions} tx</td>
                  <td className="py-3 px-4 text-right">{formatRupiah(revenueReport.summary.totalSubtotal)}</td>
                  <td className="py-3 px-4 text-right text-rose-700">-{formatRupiah(revenueReport.summary.totalDiscount)}</td>
                  <td className="py-3 px-4 text-right">+{formatRupiah(revenueReport.summary.totalTax)}</td>
                  <td className="py-3 px-4 text-right text-sm text-slate-900">{formatRupiah(revenueReport.summary.totalRevenue)}</td>
                  <td className="py-3 px-4 text-right text-rose-700">{formatRupiah(revenueReport.summary.totalCommission)}</td>
                  <td className="py-3 px-4 text-right text-sm text-emerald-800">{formatRupiah(revenueReport.summary.netRevenue)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Grid: Layanan Terlaris & 10 Transaksi Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Services Leaderboard */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900">Layanan Paling Diminati</h3>
            <p className="text-xs text-slate-400">Top treatment kuku berdasarkan pesanan</p>
          </div>

          <div className="space-y-3 pt-1">
            {topServices.map((svc, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                      idx === 0
                        ? 'bg-amber-100 text-amber-700'
                        : idx === 1
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{svc.serviceName}</h4>
                    <p className="text-[11px] text-slate-400">{svc.totalSold}x dipesan</p>
                  </div>
                </div>
                <span className="text-xs font-black text-slate-900">{formatRupiah(svc.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 10 Riwayat Transaksi Kasir Terbaru */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-base text-slate-900">10 Riwayat Transaksi Kasir Terbaru</h3>
              <p className="text-xs text-slate-400">Transaksi selesai secara real-time</p>
            </div>
            <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200/60">
              Sinkronisasi Langsung
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Invoice</th>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Pelanggan</th>
                  <th className="py-3 px-4">Nail Artist</th>
                  <th className="py-3 px-4">Metode</th>
                  <th className="py-3 px-4 text-right">Total Transaksi</th>
                  <th className="py-3 px-4 text-center">Struk Gambar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{tx.invoiceNumber}</td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(tx.createdAt)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{tx.customer?.name || 'Walk-in'}</td>
                    <td className="py-3 px-4 text-rose-700 font-medium">💅 {tx.artist?.name || '-'}</td>
                    <td className="py-3 px-4">
                      <Badge variant={tx.paymentMethod === 'QRIS' ? 'emerald' : 'pink'}>
                        {tx.paymentMethod}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      {formatRupiah(tx.total)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-semibold transition-colors shadow-2xs active:scale-95"
                        title="Buka Struk & Kirim Gambar ke WhatsApp"
                      >
                        <MessageCircle size={12} />
                        <span>Kirim WA</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Struk & Kirim Gambar WhatsApp */}
      <ReceiptModal
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        transaction={selectedTx}
      />
    </div>
  );
};
