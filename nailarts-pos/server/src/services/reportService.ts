import prisma from '../config/db';

export class ReportService {
  /**
   * Mengambil statistik ringkasan omzet, komisi, transaksi harian/bulanan
   */
  static async getSummaryStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Transaksi hari ini
    const todayTransactions = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: today },
        status: 'COMPLETED',
      },
    });

    const todayOmzet = todayTransactions.reduce((acc, t) => acc + t.total, 0);
    const todayTxCount = todayTransactions.length;
    const todayCommission = todayTransactions.reduce((acc, t) => acc + t.commissionAmount, 0);

    // Total Semua Transaksi
    const allTransactions = await prisma.transaction.findMany({
      where: { status: 'COMPLETED' },
    });
    const totalOmzet = allTransactions.reduce((acc, t) => acc + t.total, 0);
    const totalTransactions = allTransactions.length;
    const totalCommissionPayout = allTransactions.reduce((acc, t) => acc + t.commissionAmount, 0);

    // Total Pelanggan & Booking Menunggu
    const totalCustomers = await prisma.customer.count();
    const pendingBookings = await prisma.booking.count({
      where: { status: { in: ['PENDING', 'CONFIRMED'] } },
    });

    // Low stock items count
    const lowStockItems = await prisma.inventoryItem.count({
      where: {
        stockQuantity: { lte: 5 },
      },
    });

    return {
      today: {
        omzet: todayOmzet,
        transactionCount: todayTxCount,
        commission: todayCommission,
      },
      overall: {
        totalOmzet,
        totalTransactions,
        totalCommissionPayout,
        netRevenue: totalOmzet - totalCommissionPayout,
        totalCustomers,
        pendingBookings,
        lowStockAlerts: lowStockItems,
      },
    };
  }

  /**
   * Layanan nail art terlaris / Top Services
   */
  static async getTopServices(limit = 5) {
    const items = await prisma.transactionItem.findMany();
    const serviceMap = new Map<string, { serviceName: string; totalSold: number; revenue: number }>();

    for (const item of items) {
      const existing = serviceMap.get(item.serviceName) || {
        serviceName: item.serviceName,
        totalSold: 0,
        revenue: 0,
      };
      existing.totalSold += item.quantity;
      existing.revenue += item.totalPrice;
      serviceMap.set(item.serviceName, existing);
    }

    return Array.from(serviceMap.values())
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, limit);
  }

  /**
   * Grafik pendapatan 7 hari terakhir
   */
  static async getWeeklyRevenue() {
    const days: Array<{ date: string; label: string; revenue: number; txCount: number }> = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));

      const dayTxs = await prisma.transaction.findMany({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: 'COMPLETED',
        },
      });

      const dayRevenue = dayTxs.reduce((sum, t) => sum + t.total, 0);
      const label = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
      const dateStr = startOfDay.toISOString().slice(0, 10);

      days.push({
        date: dateStr,
        label,
        revenue: dayRevenue,
        txCount: dayTxs.length,
      });
    }

    return days;
  }

  /**
   * Mengambil laporan omzet terperinci berdasarkan periode: daily, weekly, monthly, yearly
   */
  static async getRevenueReport(period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily') {
    const allTransactions = await prisma.transaction.findMany({
      where: { status: 'COMPLETED' },
    });

    const now = new Date();
    const rows: Array<{
      periodKey: string;
      label: string;
      startDate: string;
      endDate: string;
      txCount: number;
      subtotal: number;
      discount: number;
      tax: number;
      revenue: number;
      commission: number;
      netRevenue: number;
    }> = [];

    if (period === 'daily') {
      // 14 hari terakhir
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
        const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

        const txs = allTransactions.filter((t) => {
          const tTime = new Date(t.createdAt).getTime();
          return tTime >= start.getTime() && tTime <= end.getTime();
        });

        const revenue = txs.reduce((sum, t) => sum + (t.total || 0), 0);
        const subtotal = txs.reduce((sum, t) => sum + (t.subtotal || t.total || 0), 0);
        const discount = txs.reduce((sum, t) => sum + (t.discount || 0), 0);
        const tax = txs.reduce((sum, t) => sum + (t.tax || 0), 0);
        const commission = txs.reduce((sum, t) => sum + (t.commissionAmount || 0), 0);

        rows.push({
          periodKey: start.toISOString().slice(0, 10),
          label: start.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }),
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10),
          txCount: txs.length,
          subtotal,
          discount,
          tax,
          revenue,
          commission,
          netRevenue: revenue - commission,
        });
      }
    } else if (period === 'weekly') {
      // 8 minggu terakhir
      for (let i = 7; i >= 0; i--) {
        const end = new Date(now);
        end.setDate(end.getDate() - i * 7);
        end.setHours(23, 59, 59, 999);

        const start = new Date(end);
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);

        const txs = allTransactions.filter((t) => {
          const tTime = new Date(t.createdAt).getTime();
          return tTime >= start.getTime() && tTime <= end.getTime();
        });

        const revenue = txs.reduce((sum, t) => sum + (t.total || 0), 0);
        const subtotal = txs.reduce((sum, t) => sum + (t.subtotal || t.total || 0), 0);
        const discount = txs.reduce((sum, t) => sum + (t.discount || 0), 0);
        const tax = txs.reduce((sum, t) => sum + (t.tax || 0), 0);
        const commission = txs.reduce((sum, t) => sum + (t.commissionAmount || 0), 0);

        const startLabel = start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        const endLabel = end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

        rows.push({
          periodKey: `W-${start.toISOString().slice(0, 10)}`,
          label: `${startLabel} - ${endLabel}`,
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10),
          txCount: txs.length,
          subtotal,
          discount,
          tax,
          revenue,
          commission,
          netRevenue: revenue - commission,
        });
      }
    } else if (period === 'monthly') {
      // 12 bulan di tahun berjalan
      const currentYear = now.getFullYear();
      for (let m = 0; m <= 11; m++) {
        const start = new Date(currentYear, m, 1, 0, 0, 0, 0);
        const end = new Date(currentYear, m + 1, 0, 23, 59, 59, 999);

        const txs = allTransactions.filter((t) => {
          const tTime = new Date(t.createdAt).getTime();
          return tTime >= start.getTime() && tTime <= end.getTime();
        });

        const revenue = txs.reduce((sum, t) => sum + (t.total || 0), 0);
        const subtotal = txs.reduce((sum, t) => sum + (t.subtotal || t.total || 0), 0);
        const discount = txs.reduce((sum, t) => sum + (t.discount || 0), 0);
        const tax = txs.reduce((sum, t) => sum + (t.tax || 0), 0);
        const commission = txs.reduce((sum, t) => sum + (t.commissionAmount || 0), 0);

        rows.push({
          periodKey: `${currentYear}-${String(m + 1).padStart(2, '0')}`,
          label: start.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10),
          txCount: txs.length,
          subtotal,
          discount,
          tax,
          revenue,
          commission,
          netRevenue: revenue - commission,
        });
      }
    } else if (period === 'yearly') {
      // 5 tahun terakhir
      const currentYear = now.getFullYear();
      for (let y = currentYear - 4; y <= currentYear; y++) {
        const start = new Date(y, 0, 1, 0, 0, 0, 0);
        const end = new Date(y, 11, 31, 23, 59, 59, 999);

        const txs = allTransactions.filter((t) => {
          const tTime = new Date(t.createdAt).getTime();
          return tTime >= start.getTime() && tTime <= end.getTime();
        });

        const revenue = txs.reduce((sum, t) => sum + (t.total || 0), 0);
        const subtotal = txs.reduce((sum, t) => sum + (t.subtotal || t.total || 0), 0);
        const discount = txs.reduce((sum, t) => sum + (t.discount || 0), 0);
        const tax = txs.reduce((sum, t) => sum + (t.tax || 0), 0);
        const commission = txs.reduce((sum, t) => sum + (t.commissionAmount || 0), 0);

        rows.push({
          periodKey: `${y}`,
          label: `Tahun ${y}`,
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10),
          txCount: txs.length,
          subtotal,
          discount,
          tax,
          revenue,
          commission,
          netRevenue: revenue - commission,
        });
      }
    }

    const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
    const totalTransactions = rows.reduce((s, r) => s + r.txCount, 0);
    const totalSubtotal = rows.reduce((s, r) => s + r.subtotal, 0);
    const totalDiscount = rows.reduce((s, r) => s + r.discount, 0);
    const totalTax = rows.reduce((s, r) => s + r.tax, 0);
    const totalCommission = rows.reduce((s, r) => s + r.commission, 0);
    const netRevenue = totalRevenue - totalCommission;
    const averagePerTx = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

    return {
      period,
      summary: {
        totalRevenue,
        totalTransactions,
        averagePerTx,
        totalSubtotal,
        totalDiscount,
        totalTax,
        totalCommission,
        netRevenue,
      },
      rows,
    };
  }
}
