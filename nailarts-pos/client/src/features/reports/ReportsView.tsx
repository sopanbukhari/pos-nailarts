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
  ShieldCheck,
  PieChart,
  FileText,
  Building,
  ShoppingBag,
  Zap,
  Tag,
  CheckCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatDate, formatRupiah } from '../../utils/format';
import { ReceiptModal } from '../pos/ReceiptModal';
import { Transaction } from '../../types';
import api from '../../lib/axios';

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
type ActiveReportTab = 'SALES' | 'PNL' | 'AUDIT';

export const ReportsView: React.FC = () => {
  const [activeReportTab, setActiveReportTab] = useState<ActiveReportTab>('SALES');

  const [summary, setSummary] = useState<any>(null);
  const [topServices, setTopServices] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  // State untuk Laporan Omzet Berdasarkan Periode
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('daily');
  const [revenueReport, setRevenueReport] = useState<any>(null);
  const [loadingPeriod, setLoadingPeriod] = useState(false);

  // State untuk Laporan Laba Rugi (P&L)
  const [pnlData, setPnlData] = useState<any>(null);
  const [loadingPnl, setLoadingPnl] = useState(false);

  // State untuk Log Audit
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeReportTab === 'SALES') {
      fetchRevenuePeriod(selectedPeriod);
    } else if (activeReportTab === 'PNL') {
      fetchProfitAndLoss();
    } else if (activeReportTab === 'AUDIT') {
      fetchAuditLogs();
    }
  }, [activeReportTab, selectedPeriod]);

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

  const fetchProfitAndLoss = async () => {
    setLoadingPnl(true);
    try {
      const res = await api.get('/reports/profit-and-loss');
      if (res.data.success) {
        setPnlData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching P&L data:', err);
    } finally {
      setLoadingPnl(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const res = await api.get('/reports/audit-logs?limit=50');
      if (res.data.success) {
        setAuditLogs(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoadingAudit(false);
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

    let csvContent = '\uFEFF';
    csvContent += `LAPORAN OMZET & KINERJA KEUANGAN SALON\n`;
    csvContent += `NailArt Studio Salon - Senopati Raya, Jakarta Selatan\n`;
    csvContent += `Periode: ${selectedPeriod.toUpperCase()} | Waktu Export: ${new Date().toLocaleString('id-ID')}\n\n`;

    csvContent +=
      'Periode / Tanggal,Jml Transaksi,Subtotal (Rp),Diskon (Rp),PPN (Rp),Total Omzet (Rp),Komisi Artist (Rp),Net Salon (Rp)\n';

    revenueReport.rows.forEach((row: any) => {
      csvContent += `"${row.label}",${row.txCount},${row.subtotal},${row.discount},${row.tax},${row.revenue},${row.commission},${row.netRevenue}\n`;
    });

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
      {/* Top Report Module Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveReportTab('SALES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeReportTab === 'SALES'
              ? 'bg-blush-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 size={15} />
          <span>Ringkasan Penjualan & Omzet</span>
        </button>

        <button
          onClick={() => setActiveReportTab('PNL')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeReportTab === 'PNL'
              ? 'bg-blush-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <PieChart size={15} />
          <span>Laporan Laba Rugi (Profit & Loss)</span>
        </button>

        <button
          onClick={() => setActiveReportTab('AUDIT')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeReportTab === 'AUDIT'
              ? 'bg-blush-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck size={15} />
          <span>Log Audit & Keamanan Sistem</span>
        </button>
      </div>

      {activeReportTab === 'SALES' && (
        <>
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Omzet Hari Ini
                </span>
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
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Omzet Keseluruhan
                </span>
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
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Komisi Artist
                </span>
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
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Pelanggan Terdaftar
                </span>
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

          {/* Laporan Omzet Grafik & Tabel */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <BarChart3 size={18} className="text-blush-600" />
                  <span>Tren & Rincian Omzet Salon</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Analisis pergerakan omzet, potongan diskon, pajak, dan bagi hasil komisi nail artist
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  {(['daily', 'weekly', 'monthly', 'yearly'] as ReportPeriod[]).map((period) => (
                    <button
                      key={period}
                      onClick={() => setSelectedPeriod(period)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedPeriod === period
                          ? 'bg-white text-blush-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {period === 'daily'
                        ? '14 Hari'
                        : period === 'weekly'
                        ? 'Mingguan'
                        : period === 'monthly'
                        ? 'Bulanan'
                        : 'Tahunan'}
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadCSV}
                  className="flex items-center gap-1.5 text-xs text-slate-700 border-slate-200"
                >
                  <FileSpreadsheet size={14} className="text-emerald-600" />
                  <span>Download Excel/CSV</span>
                </Button>
              </div>
            </div>

            {/* Barchart Visualizer */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/40">
              {loadingPeriod ? (
                <div className="h-44 flex items-center justify-center text-xs text-slate-400">
                  Memuat grafik omzet...
                </div>
              ) : revenueReport?.rows?.length === 0 ? (
                <div className="h-44 flex items-center justify-center text-xs text-slate-400">
                  Tidak ada data transaksi pada rentang periode ini.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-end gap-2 h-40 pt-4 px-2">
                    {revenueReport?.rows?.map((row: any, idx: number) => {
                      const heightPercent = Math.max(8, Math.round((row.revenue / maxRevenue) * 100));
                      return (
                        <div
                          key={idx}
                          className="flex-1 flex flex-col items-center gap-1.5 group relative"
                        >
                          <div className="absolute -top-8 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                            {row.label}: {formatRupiah(row.revenue)} ({row.txCount} tx)
                          </div>
                          <div className="w-full bg-slate-100 rounded-t-lg overflow-hidden flex flex-col justify-end h-32">
                            <div
                              style={{ height: `${heightPercent}%` }}
                              className="w-full bg-gradient-to-t from-blush-600 to-rose-400 rounded-t-lg group-hover:brightness-110 transition-all"
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium truncate w-full text-center">
                            {row.label.split(',')[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Periodic Revenue Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Periode</th>
                    <th className="py-3 px-4 text-center">Jml Transaksi</th>
                    <th className="py-3 px-4 text-right">Subtotal</th>
                    <th className="py-3 px-4 text-right">Diskon</th>
                    <th className="py-3 px-4 text-right">Pajak (PPN)</th>
                    <th className="py-3 px-4 text-right">Total Omzet</th>
                    <th className="py-3 px-4 text-right">Komisi Artist</th>
                    <th className="py-3 px-4 text-right">Pendapatan Bersih Salon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {revenueReport?.rows?.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800">{row.label}</td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-600">
                        {row.txCount}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">{formatRupiah(row.subtotal)}</td>
                      <td className="py-3 px-4 text-right text-emerald-600">
                        {row.discount > 0 ? `-${formatRupiah(row.discount)}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {row.tax > 0 ? `+${formatRupiah(row.tax)}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        {formatRupiah(row.revenue)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-rose-600">
                        {formatRupiah(row.commission)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-blush-700">
                        {formatRupiah(row.netRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Services & Recent Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Sparkles size={16} className="text-blush-600" />
                <span>Layanan Nail Art Terpopuler</span>
              </h3>
              <div className="space-y-3">
                {topServices.map((service, index) => (
                  <div
                    key={service.id || index}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">
                        {index + 1}. {service.name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {service.totalBookings || service.totalSold || 0}x dikerjakan
                      </span>
                    </div>
                    <span className="text-xs font-black text-blush-700">
                      {formatRupiah(service.price || service.totalRevenue || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-sm text-slate-800">10 Transaksi Kasir Terakhir</h3>
                <span className="text-xs text-slate-400">Update Realtime</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">No. Invoice</th>
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4">Pelanggan</th>
                      <th className="py-3 px-4">Artist</th>
                      <th className="py-3 px-4">Metode</th>
                      <th className="py-3 px-4 text-right">Total</th>
                      <th className="py-3 px-4 text-center">Struk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {tx.invoiceNumber}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{formatDate(tx.createdAt)}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {tx.customer?.name || 'Walk-in'}
                        </td>
                        <td className="py-3 px-4 text-rose-700 font-medium">
                          💅 {tx.artist?.name || '-'}
                        </td>
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
                            className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-semibold"
                          >
                            <MessageCircle size={12} />
                            <span>Struk WA</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* SEKSI PROFIT & LOSS (LABA RUGI) */}
      {/* ============================================================ */}
      {activeReportTab === 'PNL' && (
        <div className="space-y-6">
          {/* P&L Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Pendapatan Kotor (Gross)
              </span>
              <span className="text-2xl font-black text-slate-900 block">
                {formatRupiah(pnlData?.summary?.grossRevenue || 0)}
              </span>
              <div className="text-[11px] text-slate-500 mt-2 space-y-0.5 border-t border-slate-100 pt-1.5">
                <div className="flex justify-between">
                  <span>💅 Layanan Seni Kuku:</span>
                  <span className="font-bold">{formatRupiah(pnlData?.revenue?.serviceRevenue || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>🛍️ Produk Retail:</span>
                  <span className="font-bold">{formatRupiah(pnlData?.revenue?.productRevenue || 0)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Beban Operasional (Expenses)
              </span>
              <span className="text-2xl font-black text-rose-600 block">
                -{formatRupiah(pnlData?.summary?.totalExpenses || 0)}
              </span>
              <span className="text-[11px] text-slate-400 mt-2 block border-t border-slate-100 pt-1.5">
                Sewa studio, listrik, bahan baku, tools
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Bagi Hasil Komisi Artist
              </span>
              <span className="text-2xl font-black text-amber-600 block">
                -{formatRupiah(pnlData?.summary?.totalCommissions || 0)}
              </span>
              <span className="text-[11px] text-slate-400 mt-2 block border-t border-slate-100 pt-1.5">
                Komisi teknisi pengerjaan treatment
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Laba Bersih Salon (Net Profit)
              </span>
              <span
                className={`text-2xl font-black block ${
                  (pnlData?.summary?.netProfit || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {formatRupiah(pnlData?.summary?.netProfit || 0)}
              </span>
              <span className="text-[11px] text-emerald-700 font-bold mt-2 block border-t border-slate-100 pt-1.5">
                Margin Bersih: {pnlData?.summary?.profitMarginPercent || 0}%
              </span>
            </div>
          </div>

          {/* Breakdown Laba Rugi */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pengeluaran per Kategori */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Receipt size={16} className="text-blush-600" />
                <span>Rincian Beban Operasional Berdasarkan Kategori</span>
              </h3>

              {loadingPnl ? (
                <div className="p-8 text-center text-xs text-slate-400">Memuat rincian laba rugi...</div>
              ) : Object.keys(pnlData?.expenses?.byCategory || {}).length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Belum ada catatan pengeluaran operasional.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {Object.entries(pnlData?.expenses?.byCategory || {}).map(([cat, amt]: any) => (
                    <div
                      key={cat}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <span className="font-bold text-xs text-slate-700">{cat}</span>
                      <span className="font-black text-xs text-rose-600">-{formatRupiah(amt)}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-xs">
                    <span>Total Beban Operasional:</span>
                    <span className="text-rose-600">
                      -{formatRupiah(pnlData?.summary?.totalExpenses || 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Rekapitulasi Laba Rugi (P&L Financial Statement) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <FileText size={16} className="text-emerald-600" />
                <span>Laporan Ikhtisar Finansial (Statement)</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>1. Total Pendapatan Kotor (Gross Revenue)</span>
                    <span className="text-slate-900">{formatRupiah(pnlData?.summary?.grossRevenue || 0)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 pl-4 text-[11px]">
                    <span>• Penjualan Layanan Salon:</span>
                    <span>{formatRupiah(pnlData?.revenue?.serviceRevenue || 0)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 pl-4 text-[11px]">
                    <span>• Penjualan Produk Retail:</span>
                    <span>{formatRupiah(pnlData?.revenue?.productRevenue || 0)}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100 space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>2. Beban & Biaya Operasional</span>
                    <span className="text-rose-600">
                      -{formatRupiah(
                        (pnlData?.summary?.totalExpenses || 0) + (pnlData?.summary?.totalCommissions || 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 pl-4 text-[11px]">
                    <span>• Komisi Artist / Teknisi:</span>
                    <span className="text-rose-600">
                      -{formatRupiah(pnlData?.summary?.totalCommissions || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 pl-4 text-[11px]">
                    <span>• Beban Operasional Studio:</span>
                    <span className="text-rose-600">
                      -{formatRupiah(pnlData?.summary?.totalExpenses || 0)}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex justify-between items-center text-sm font-black">
                  <span className="text-emerald-950">LABA BERSIH SALON (NET PROFIT):</span>
                  <span className="text-emerald-700 text-base">
                    {formatRupiah(pnlData?.summary?.netProfit || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SEKSI AUDIT LOG */}
      {/* ============================================================ */}
      {activeReportTab === 'AUDIT' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <ShieldCheck size={16} className="text-blush-600" />
                <span>Log Aktivitas & Audit Keamanan Sistem</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Semua operasi sensitif (checkout, refund, perubahan stok, login) tercatat permanen di PostgreSQL.
              </p>
            </div>
            <span className="text-xs text-slate-400">{auditLogs.length} Catatan Terakhir</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Pengguna / Staff</th>
                  <th className="py-3 px-4">Tindakan (Action)</th>
                  <th className="py-3 px-4">Target Entitas</th>
                  <th className="py-3 px-4">Rincian Perubahan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingAudit ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      Memuat log audit...
                    </td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      Belum ada log audit yang tersimpan.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {log.user?.name || 'Sistem / Anonim'}
                        <span className="text-[10px] text-slate-400 block font-normal font-mono">
                          {log.user?.email}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {log.entity} {log.entityId ? `#${log.entityId.slice(0, 8)}` : ''}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[10px] max-w-sm truncate" title={log.newValuesJson || log.details}>
                        {log.newValuesJson || log.details || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Struk & Kirim Gambar WhatsApp */}
      <ReceiptModal
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        transaction={selectedTx}
      />
    </div>
  );
};
