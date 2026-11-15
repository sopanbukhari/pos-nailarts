import { Request, Response } from 'express';
import prisma from '../config/db';
import { BookingService } from '../services/bookingService';

export class BookingController {
  static async getBookings(req: Request, res: Response): Promise<void> {
    try {
      const { date, artistId, status } = req.query;
      const whereClause: any = {};

      if (date) whereClause.date = String(date);
      if (status) whereClause.status = String(status);

      if (artistId) {
        const empId = await BookingService.resolveEmployeeId(String(artistId));
        if (empId) whereClause.employeeId = empId;
      }

      const appointments = await prisma.appointment.findMany({
        where: whereClause,
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        include: {
          customer: true,
          employee: {
            include: {
              user: { select: { id: true, name: true, phone: true } },
            },
          },
          services: {
            include: {
              service: true,
            },
          },
        },
      });

      // Map to frontend-friendly structure
      const formatted = appointments.map((b: any) => ({
        id: b.id,
        customerId: b.customerId,
        customer: b.customer,
        artistId: b.employee?.userId,
        artist: {
          id: b.employee?.userId,
          employeeId: b.employee?.id,
          name: b.employee?.user?.name,
          phone: b.employee?.user?.phone,
        },
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
        totalDuration: b.totalEstimatedDuration,
        totalPrice: b.totalPrice,
        downPaymentAmount: b.downPaymentAmount,
        status: b.status,
        notes: b.notes,
        createdAt: b.createdAt,
        items: (b.services || []).map((s: any) => ({
          id: s.id,
          serviceId: s.serviceId,
          service: s.service,
          price: s.price,
          durationMinutes: s.durationMinutes,
        })),
      }));

      res.json({ success: true, data: formatted });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getBookingById(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const b: any = await prisma.appointment.findUnique({
        where: { id },
        include: {
          customer: true,
          employee: { include: { user: true } },
          services: { include: { service: true } },
        },
      });

      if (!b) {
        res.status(404).json({ success: false, message: 'Janji temu tidak ditemukan.' });
        return;
      }

      res.json({
        success: true,
        data: {
          ...b,
          artist: b.employee?.user,
          items: b.services,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async createBooking(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, artistId, date, startTime, items = [], downPaymentAmount = 0, notes } = req.body;

      if (!customerId || !artistId || !date || !startTime || items.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Data booking tidak lengkap (pelanggan, nail artist, tanggal, jam, dan layanan wajib diisi).',
        });
        return;
      }

      const employeeId = await BookingService.resolveEmployeeId(String(artistId));
      if (!employeeId) {
        res.status(400).json({ success: false, message: 'Nail artist tidak valid.' });
        return;
      }

      let totalDuration = 0;
      let totalPrice = 0;

      for (const item of items) {
        totalPrice += (Number(item.price) || 0);
        totalDuration += (Number(item.durationMinutes) || 45);
      }

      const endTime = BookingService.calculateEndTime(String(startTime), totalDuration);

      const isAvailable = await BookingService.checkAvailability(String(artistId), String(date), String(startTime), totalDuration);
      if (!isAvailable) {
        res.status(409).json({
          success: false,
          message: 'Jadwal Nail Artist pada jam tersebut sudah terisi. Silakan pilih waktu lain.',
        });
        return;
      }

      const appointment = await prisma.appointment.create({
        data: {
          customerId: String(customerId),
          employeeId,
          date: String(date),
          startTime: String(startTime),
          endTime,
          totalEstimatedDuration: totalDuration,
          totalPrice,
          downPaymentAmount: Number(downPaymentAmount) || 0,
          status: 'CONFIRMED',
          notes: notes ? String(notes) : null,
          services: {
            create: items.map((it: any) => ({
              serviceId: String(it.serviceId),
              price: Number(it.price) || 0,
              durationMinutes: Number(it.durationMinutes) || 45,
            })),
          },
        },
        include: {
          customer: true,
          employee: { include: { user: true } },
          services: { include: { service: true } },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Janji temu (booking) berhasil dijadwalkan.',
        data: appointment,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateBooking(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { artistId, date, startTime, status, notes, downPaymentAmount } = req.body;

      const existing = await prisma.appointment.findUnique({
        where: { id },
        include: { services: true },
      });

      if (!existing) {
        res.status(404).json({ success: false, message: 'Janji temu tidak ditemukan.' });
        return;
      }

      const targetDate = date ? String(date) : existing.date;
      const targetStartTime = startTime ? String(startTime) : existing.startTime;
      const targetArtistId = artistId ? String(artistId) : existing.employeeId;
      const totalDuration = existing.totalEstimatedDuration;

      if (date || startTime || artistId) {
        const isAvailable = await BookingService.checkAvailability(
          targetArtistId,
          targetDate,
          targetStartTime,
          totalDuration,
          id
        );

        if (!isAvailable) {
          res.status(409).json({
            success: false,
            message: 'Jadwal Nail Artist pada jam tersebut sudah terisi. Silakan pilih waktu lain.',
          });
          return;
        }
      }

      const employeeId = artistId ? await BookingService.resolveEmployeeId(String(artistId)) : existing.employeeId;
      const endTime = (startTime || date) ? BookingService.calculateEndTime(targetStartTime, totalDuration) : existing.endTime;

      const updated = await prisma.appointment.update({
        where: { id },
        data: {
          ...(employeeId ? { employeeId } : {}),
          date: targetDate,
          startTime: targetStartTime,
          endTime,
          ...(status ? { status } : {}),
          ...(notes !== undefined ? { notes: String(notes) } : {}),
          ...(downPaymentAmount !== undefined ? { downPaymentAmount: Number(downPaymentAmount) } : {}),
        },
        include: {
          customer: true,
          employee: { include: { user: true } },
          services: { include: { service: true } },
        },
      });

      res.json({
        success: true,
        message: 'Janji temu berhasil diperbarui.',
        data: updated,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { status } = req.body;

      const updated = await prisma.appointment.update({
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

  static async deleteBooking(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      await prisma.appointment.delete({ where: { id } });
      res.json({ success: true, message: 'Janji temu berhasil dibatalkan dan dihapus.' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
