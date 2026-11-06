import { Request, Response } from 'express';
import prisma from '../config/db';
import { BookingService } from '../services/bookingService';

export class BookingController {
  static async getBookings(req: Request, res: Response): Promise<void> {
    try {
      const { date, artistId, status } = req.query;
      const whereClause: any = {};

      if (date) whereClause.date = String(date);
      if (artistId) whereClause.artistId = String(artistId);
      if (status) whereClause.status = String(status);

      const bookings = await prisma.booking.findMany({
        where: whereClause,
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        include: {
          customer: true,
          artist: { select: { id: true, name: true, phone: true } },
          items: {
            include: {
              service: true,
            },
          },
        },
      });

      res.json({ success: true, data: bookings });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async createBooking(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, artistId, date, startTime, items = [], notes } = req.body;

      if (!customerId || !artistId || !date || !startTime || items.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Data booking tidak lengkap (pelanggan, nail artist, tanggal, jam, dan layanan wajib diisi).',
        });
        return;
      }

      // Hitung total durasi dan harga dari items
      let totalDuration = 0;
      let totalPrice = 0;

      for (const item of items) {
        totalPrice += (item.price || 0);
        totalDuration += (item.durationMinutes || 45);
      }

      // Hitung jam selesai
      const endTime = BookingService.calculateEndTime(startTime, totalDuration);

      // Cek ketersediaan slot artist
      const isAvailable = await BookingService.checkAvailability(artistId, date, startTime, totalDuration);
      if (!isAvailable) {
        res.status(409).json({
          success: false,
          message: 'Jadwal Nail Artist pada jam tersebut sudah terisi. Silakan pilih waktu lain.',
        });
        return;
      }

      const booking = await prisma.booking.create({
        data: {
          customerId,
          artistId,
          date,
          startTime,
          endTime,
          notes,
          totalPrice,
          status: 'CONFIRMED',
          items: {
            create: items.map((it: any) => ({
              serviceId: it.serviceId,
              addonNamesJson: it.addonNames ? JSON.stringify(it.addonNames) : null,
              price: it.price,
            })),
          },
        },
        include: {
          customer: true,
          artist: { select: { id: true, name: true } },
          items: { include: { service: true } },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Janji temu (booking) berhasil dijadwalkan.',
        data: booking,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updated = await prisma.booking.update({
        where: { id },
        data: { status },
      });

      res.json({
        success: true,
        message: `Status booking diubah menjadi ${status}.`,
        data: updated,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
