import prisma from '../config/db';

export class BookingService {
  /**
   * Cek jadwal ketersediaan slot nail artist
   */
  static async checkAvailability(artistId: string, date: string, startTime: string, durationMinutes: number) {
    const [startH, startM] = startTime.split(':').map(Number);
    const startTotalMinutes = startH * 60 + startM;
    const endTotalMinutes = startTotalMinutes + durationMinutes;

    const existingBookings = await prisma.booking.findMany({
      where: {
        artistId,
        date,
        status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
      },
    });

    const isConflict = existingBookings.some(b => {
      const [bStartH, bStartM] = b.startTime.split(':').map(Number);
      const [bEndH, bEndM] = b.endTime.split(':').map(Number);
      const bStartTotal = bStartH * 60 + bStartM;
      const bEndTotal = bEndH * 60 + bEndM;

      // Overlapping condition
      return Math.max(startTotalMinutes, bStartTotal) < Math.min(endTotalMinutes, bEndTotal);
    });

    return !isConflict;
  }

  /**
   * Hitung estimasi jam selesai berdasarkan durasi layanan
   */
  static calculateEndTime(startTime: string, totalMinutes: number): string {
    const [h, m] = startTime.split(':').map(Number);
    const totalM = h * 60 + m + totalMinutes;
    const endH = Math.floor(totalM / 60) % 24;
    const endM = totalM % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  }
}
