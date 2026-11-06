import prisma from '../config/db';

export class CommissionService {
  /**
   * Hitung komisi artist untuk item transaksi tertentu
   */
  static async calculateItemCommission(artistId: string | undefined, servicePrice: number): Promise<number> {
    if (!artistId) return 0;

    const artist = await prisma.user.findUnique({
      where: { id: artistId },
      select: { commissionRate: true, role: true },
    });

    if (!artist) return 0;
    const rate = artist.commissionRate || 0.20; // Default 20%
    return Math.round(servicePrice * rate);
  }

  /**
   * Rekap ringkasan komisi per nail artist
   */
  static async getArtistCommissionSummary(startDate?: string, endDate?: string) {
    const artists = await prisma.user.findMany({
      where: { role: 'ARTIST' },
      select: { id: true, name: true, phone: true, commissionRate: true },
    });

    const whereClause: any = {
      status: 'COMPLETED',
      artistId: { not: null },
    };

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        items: true,
      },
    });

    return artists.map(artist => {
      const artistTx = transactions.filter(t => t.artistId === artist.id);
      const totalServices = artistTx.reduce((sum: number, tx: any) => sum + (tx.items || []).reduce((iSum: number, it: any) => iSum + (it.quantity || 1), 0), 0);
      const totalGross = artistTx.reduce((sum: number, tx: any) => sum + tx.subtotal, 0);
      const totalCommission = artistTx.reduce((sum: number, tx: any) => sum + tx.commissionAmount, 0);

      return {
        artistId: artist.id,
        name: artist.name,
        phone: artist.phone,
        commissionRatePercent: Math.round(artist.commissionRate * 100),
        completedTransactionsCount: artistTx.length,
        totalServicesHandled: totalServices,
        totalGrossGenerated: totalGross,
        totalCommissionPayout: totalCommission,
      };
    });
  }
}
