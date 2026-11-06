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
}
