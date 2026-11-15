import prisma from '../config/db';

export class ReportService {
  /**
   * Mengambil statistik ringkasan omzet, komisi, transaksi harian/bulanan & Profit/Loss
   */
  static async getSummaryStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 7 hari lalu
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // 30 hari lalu
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    // 1. Transaksi Hari Ini
    const todaySales = await prisma.sale.findMany({
      where: {
        createdAt: { gte: today },
        status: 'PAID',
      },
    });

    const todayOmzet = todaySales.reduce((acc, s) => acc + s.totalAmount, 0);
    const todayTxCount = todaySales.length;

    // 2. Transaksi Mingguan & Bulanan
    const [weeklySales, monthlySales, allSales] = await Promise.all([
      prisma.sale.findMany({ where: { createdAt: { gte: weekAgo }, status: 'PAID' } }),
      prisma.sale.findMany({ where: { createdAt: { gte: monthAgo }, status: 'PAID' } }),
      prisma.sale.findMany({ where: { status: 'PAID' } }),
    ]);

    const weeklyOmzet = weeklySales.reduce((acc, s) => acc + s.totalAmount, 0);
    const monthlyOmzet = monthlySales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalOmzet = allSales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalTransactions = allSales.length;

    // 3. Komisi Staf
    const allCommissions = await prisma.commission.findMany();
    const totalCommissionPayout = allCommissions.reduce((acc, c) => acc + c.amount, 0);

    // 4. Pengeluaran (Expenses)
    const allExpenses = await prisma.expense.findMany();
    const totalExpenses = allExpenses.reduce((acc, e) => acc + e.amount, 0);

    // 5. Total Pelanggan & Booking Menunggu
    const totalCustomers = await prisma.customer.count();
    const pendingBookings = await prisma.appointment.count({
      where: { status: { in: ['PENDING', 'CONFIRMED'] } },
    });

    // 6. Low stock items count (stock <= minStockAlert)
    const allProducts = await prisma.product.findMany({ where: { isActive: true } });
    const lowStockAlerts = allProducts.filter((p) => p.stockQuantity <= p.minStockAlert).length;

    // Profit & Loss calculation: Net Profit = Revenue - Commissions - Expenses
    const netProfit = totalOmzet - totalCommissionPayout - totalExpenses;

    return {
      today: {
        omzet: todayOmzet,
        transactionCount: todayTxCount,
        commission: allCommissions
          .filter((c) => new Date(c.createdAt) >= today)
          .reduce((sum, c) => sum + c.amount, 0),
      },
      weekly: {
        omzet: weeklyOmzet,
        transactionCount: weeklySales.length,
      },
      monthly: {
        omzet: monthlyOmzet,
        transactionCount: monthlySales.length,
      },
      overall: {
        totalOmzet,
        totalTransactions,
        totalCommissionPayout,
        totalExpenses,
        netRevenue: totalOmzet - totalCommissionPayout,
        netProfit,
        totalCustomers,
        pendingBookings,
        lowStockAlerts,
      },
    };
  }

  /**
   * Layanan nail art terlaris & Produk terlaris (Top Services & Products)
   */
  static async getTopServices(limit = 5) {
    const items = await prisma.saleItem.findMany();
    const serviceMap = new Map<string, { serviceName: string; totalSold: number; revenue: number; itemType: string }>();

    for (const item of items) {
      const existing = serviceMap.get(item.itemName) || {
        serviceName: item.itemName,
        totalSold: 0,
        revenue: 0,
        itemType: item.itemType,
      };
      existing.totalSold += item.quantity;
      existing.revenue += item.totalPrice;
      serviceMap.set(item.itemName, existing);
    }

    return Array.from(serviceMap.values())
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, limit);
  }

  /**
   * Performa & Omzet per Nail Artist / Teknisi
   */
  static async getRevenuePerTechnician() {
    const employees = await prisma.employee.findMany({
      include: {
        user: { select: { id: true, name: true } },
        commissions: {
          include: { sale: true },
        },
      },
    });

    return employees.map((emp) => {
      const totalServices = emp.commissions.length;
      const totalCommission = emp.commissions.reduce((acc, c) => acc + c.amount, 0);
      const totalRevenue = emp.commissions.reduce((acc, c) => acc + (c.sale?.subtotal || 0), 0);

      return {
        employeeId: emp.id,
        name: emp.user.name,
        position: emp.position,
        commissionRatePercent: Math.round(emp.commissionRate * 100),
        totalServicesHandled: totalServices,
        totalRevenueGenerated: totalRevenue,
        totalCommissionEarned: totalCommission,
      };
    });
  }

  /**
   * Pembagian Omzet berdasarkan Metode Pembayaran
   */
  static async getPaymentMethodDistribution() {
    const payments = await prisma.payment.findMany();
    const distMap: Record<string, { count: number; totalAmount: number }> = {
      CASH: { count: 0, totalAmount: 0 },
      QRIS: { count: 0, totalAmount: 0 },
      CARD: { count: 0, totalAmount: 0 },
      BANK_TRANSFER: { count: 0, totalAmount: 0 },
      SPLIT: { count: 0, totalAmount: 0 },
    };

    for (const p of payments) {
      const method = p.paymentMethod || 'CASH';
      if (!distMap[method]) distMap[method] = { count: 0, totalAmount: 0 };
      distMap[method].count += 1;
      distMap[method].totalAmount += p.amount;
    }

    return distMap;
  }

  /**
   * Laporan Omzet Berkala (Harian, Mingguan, Bulanan, Tahunan)
   */
  static async getPeriodicReport(period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily') {
    const sales = await prisma.sale.findMany({
      where: { status: 'PAID' },
      include: {
        items: true,
        commissions: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const grouped: Record<string, {
      periodLabel: string;
      subtotal: number;
      discount: number;
      tax: number;
      total: number;
      commission: number;
      netSalon: number;
      count: number;
    }> = {};

    for (const sale of sales) {
      const date = new Date(sale.createdAt);
      let key = '';
      let label = '';

      if (period === 'daily') {
        key = date.toISOString().slice(0, 10);
        label = date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
      } else if (period === 'weekly') {
        const weekNum = Math.ceil(date.getDate() / 7);
        key = `${date.getFullYear()}-M${date.getMonth() + 1}-W${weekNum}`;
        label = `Minggu ${weekNum}, ${date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}`;
      } else if (period === 'monthly') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        label = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      } else {
        key = `${date.getFullYear()}`;
        label = `Tahun ${date.getFullYear()}`;
      }

      if (!grouped[key]) {
        grouped[key] = {
          periodLabel: label,
          subtotal: 0,
          discount: 0,
          tax: 0,
          total: 0,
          commission: 0,
          netSalon: 0,
          count: 0,
        };
      }

      const saleCommission = sale.commissions.reduce((acc, c) => acc + c.amount, 0);
      grouped[key].subtotal += sale.subtotal;
      grouped[key].discount += sale.discountAmount;
      grouped[key].tax += sale.taxAmount;
      grouped[key].total += sale.totalAmount;
      grouped[key].commission += saleCommission;
      grouped[key].netSalon += (sale.totalAmount - saleCommission);
      grouped[key].count += 1;
    }

    const rows = Object.entries(grouped).map(([key, data]) => ({
      key,
      periodKey: key,
      label: data.periodLabel,
      periodLabel: data.periodLabel,
      txCount: data.count,
      count: data.count,
      subtotal: data.subtotal,
      discount: data.discount,
      tax: data.tax,
      revenue: data.total,
      total: data.total,
      commission: data.commission,
      netRevenue: data.netSalon,
      netSalon: data.netSalon,
    }));

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

  /**
   * Laporan Laba Rugi (Profit & Loss Statement)
   */
  static async getProfitAndLoss(startDate?: string, endDate?: string) {
    const saleWhere: any = { status: 'PAID' };
    const expenseWhere: any = {};

    if (startDate && endDate) {
      saleWhere.createdAt = { gte: new Date(startDate), lte: new Date(endDate) };
      expenseWhere.date = { gte: String(startDate), lte: String(endDate) };
    }

    const [sales, expenses, commissions] = await Promise.all([
      prisma.sale.findMany({
        where: saleWhere,
        include: { items: true },
      }),
      prisma.expense.findMany({ where: expenseWhere }),
      prisma.commission.findMany({
        where: startDate && endDate ? { createdAt: { gte: new Date(startDate), lte: new Date(endDate) } } : {},
      }),
    ]);

    let serviceRevenue = 0;
    let productRevenue = 0;

    for (const s of sales) {
      for (const item of s.items) {
        if (item.itemType === 'PRODUCT') {
          productRevenue += item.totalPrice;
        } else {
          serviceRevenue += item.totalPrice;
        }
      }
    }

    const grossRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalCommissions = commissions.reduce((acc, c) => acc + c.amount, 0);

    // Group expenses by category
    const expenseByCategory: Record<string, number> = {};
    for (const exp of expenses) {
      const cat = exp.category;
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + exp.amount;
    }
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

    const netProfit = grossRevenue - totalCommissions - totalExpenses;

    return {
      revenue: {
        serviceRevenue,
        productRevenue,
        grossRevenue,
      },
      expenses: {
        totalExpenses,
        byCategory: expenseByCategory,
        items: expenses,
      },
      commissions: {
        totalCommissions,
      },
      summary: {
        grossRevenue,
        totalCommissions,
        totalExpenses,
        netProfit,
        profitMarginPercent: grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 0,
      },
    };
  }

  /**
   * Log Audit
   */
  static async getAuditLogs(limit = 50) {
    return await prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
