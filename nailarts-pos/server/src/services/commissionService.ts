import prisma from '../config/db';

export class CommissionService {
  /**
   * Rekap ringkasan komisi per nail artist dari tabel Commission & Sale
   */
  static async getArtistCommissionSummary(startDate?: string, endDate?: string) {
    const employees = await prisma.employee.findMany({
      include: {
        user: { select: { id: true, name: true, phone: true, email: true, role: true } },
        schedules: true,
      },
      orderBy: { employeeNumber: 'asc' },
    });

    const whereClause: any = {};
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const commissions = await prisma.commission.findMany({
      where: whereClause,
      include: {
        sale: {
          include: {
            items: true,
            customer: true,
          },
        },
      },
    });

    return employees.map((emp) => {
      const empComms = commissions.filter((c) => c.employeeId === emp.id);
      const pendingComms = empComms.filter((c) => c.status === 'PENDING');
      const paidComms = empComms.filter((c) => c.status === 'PAID');

      // Unique sales
      const uniqueSalesIds = new Set(empComms.map((c) => c.saleId));
      const totalServices = empComms.length;
      const totalCommission = empComms.reduce((sum, c) => sum + c.amount, 0);
      const pendingPayout = pendingComms.reduce((sum, c) => sum + c.amount, 0);
      const paidPayout = paidComms.reduce((sum, c) => sum + c.amount, 0);

      // Hitung omzet kotor yang dikontribusikan
      const totalGross = empComms.reduce((sum, c) => {
        return sum + (c.sale ? c.sale.subtotal : 0);
      }, 0);

      return {
        id: emp.id,
        userId: emp.userId,
        artistId: emp.user.id,
        employeeNumber: emp.employeeNumber,
        name: emp.user.name,
        phone: emp.user.phone,
        email: emp.user.email,
        position: emp.position,
        commissionRate: emp.commissionRate,
        commissionRatePercent: Math.round(emp.commissionRate * 100),
        completedTransactionsCount: uniqueSalesIds.size,
        totalServicesHandled: totalServices,
        totalGrossGenerated: totalGross,
        totalCommissionPayout: totalCommission,
        pendingCommission: pendingPayout,
        paidCommission: paidPayout,
        schedules: emp.schedules,
      };
    });
  }

  /**
   * Tandai komisi sebagai telah dibayarkan (payout)
   */
  static async payoutCommissions(employeeId: string) {
    const updated = await prisma.commission.updateMany({
      where: {
        employeeId,
        status: 'PENDING',
      },
      data: {
        status: 'PAID',
        payoutDate: new Date(),
      },
    });

    return updated;
  }
}
