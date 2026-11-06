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
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatDate, formatRupiah } from '../../utils/format';
import api from '../../lib/axios';

export const ReportsView: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [topServices, setTopServices] = useState<any[]>([]);
  const [weeklyRevenue, setWeeklyRevenue] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [sumRes, topRes, weekRes, txRes] = await Promise.all([
        api.get('/reports/summary'),
        api.get('/reports/top-services'),
        api.get('/reports/weekly'),
        api.get('/pos/transactions?limit=10'),
      ]);

      if (sumRes.data.success) setSummary(sumRes.data.data);
      if (topRes.data.success) setTopServices(topRes.data.data);
      if (weekRes.data.success) setWeeklyRevenue(weekRes.data.data);
      if (txRes.data.success) setRecentTransactions(txRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const maxWeekly = Math.max(...(weeklyRevenue.map(d => d.revenue) || [1000000]), 100000);

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
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
            {summary?.today?.transactionCount || 0} transaksi selesai
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
            Bagi hasil untuk nail artists
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pelanggan</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users size={16} />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-900 block">
            {summary?.overall?.totalCustomers || 0} Orang
          </span>
          <span className="text-xs text-indigo-600 font-semibold mt-1 block">
            {summary?.overall?.pendingBookings || 0} booking aktif
          </span>
        </div>
      </div>

      {/* Grid: 7-Day Chart & Top Services */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Revenue Visual Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">Tren Pendapatan 7 Hari Terakhir</h3>
              <p className="text-xs text-slate-400">Total omzet penjualan per hari</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-blush-600 bg-rose-50 px-3 py-1 rounded-xl">
              <Calendar size={14} />
              <span>Minggu Berjalan</span>
            </div>
          </div>

          <div className="h-60 flex items-end justify-between gap-3 pt-6 pb-2">
            {weeklyRevenue.map((d, idx) => {
              const heightPct = Math.max(10, Math.round((d.revenue / maxWeekly) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="text-[10px] font-bold text-slate-600">
                    {d.revenue > 0 ? `${Math.round(d.revenue / 1000)}k` : '0'}
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[42px] bg-gradient-to-t from-blush-600 to-rose-400 rounded-t-xl hover:from-blush-700 hover:to-rose-500 transition-all cursor-pointer relative group shadow-xs"
                  >
                    <div className="hidden group-hover:block absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md whitespace-nowrap z-10">
                      {formatRupiah(d.revenue)} ({d.txCount} tx)
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">{d.label.split(' ')[0]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Services Leaderboard */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900">Layanan Paling Diminati</h3>
            <p className="text-xs text-slate-400">Top treatment berdasarkan frekuensi</p>
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
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-sm text-slate-800">10 Riwayat Transaksi Kasir Terbaru</h3>
          <span className="text-xs text-slate-400">Real-time update</span>
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
                <th className="py-3 px-4">Komisi Artist</th>
                <th className="py-3 px-4 text-right">Total Transaksi</th>
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
                  <td className="py-3 px-4 font-bold text-slate-700">
                    {formatRupiah(tx.commissionAmount)}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-slate-900">
                    {formatRupiah(tx.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
