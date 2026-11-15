import prisma from '../config/db';

export class BookingService {
  /**
   * Helper untuk mencari Employee ID dari User ID atau Employee ID
   */
  static async resolveEmployeeId(artistId: string): Promise<string | null> {
    const emp = await prisma.employee.findFirst({
      where: {
        OR: [{ id: artistId }, { userId: artistId }],
      },
    });
    return emp ? emp.id : null;
  }

  /**
   * Cek ketersediaan slot nail artist & deteksi jadwal bentrok
   */
  static async checkAvailability(
    artistId: string,
    date: string,
    startTime: string,
    durationMinutes: number,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    const employeeId = await this.resolveEmployeeId(artistId);
    if (!employeeId) return false;

    const [startH, startM] = startTime.split(':').map(Number);
    const startTotalMinutes = startH * 60 + startM;
    const endTotalMinutes = startTotalMinutes + durationMinutes;

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        employeeId,
        date,
        status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'] },
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      },
    });

    const isConflict = existingAppointments.some((b) => {
      const [bStartH, bStartM] = b.startTime.split(':').map(Number);
      const [bEndH, bEndM] = b.endTime.split(':').map(Number);
      const bStartTotal = bStartH * 60 + bStartM;
      const bEndTotal = bEndH * 60 + bEndM;

      // Overlapping condition: max(start1, start2) < min(end1, end2)
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
