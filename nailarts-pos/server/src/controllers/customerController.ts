import { Request, Response } from 'express';
import prisma from '../config/db';

export class CustomerController {
  static async getCustomers(req: Request, res: Response): Promise<void> {
    try {
      const { search } = req.query;
      const whereClause: any = {};

      if (search) {
        whereClause.OR = [
          { name: { contains: String(search) } },
          { phone: { contains: String(search) } },
        ];
      }

      const customers = await prisma.customer.findMany({
        where: whereClause,
        orderBy: { updatedAt: 'desc' },
        include: {
          transactions: {
            take: 3,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      res.json({ success: true, data: customers });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getCustomerById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            include: { items: true },
          },
          bookings: {
            orderBy: { createdAt: 'desc' },
            include: { artist: true },
          },
        },
      });

      if (!customer) {
        res.status(404).json({ success: false, message: 'Pelanggan tidak ditemukan.' });
        return;
      }

      res.json({ success: true, data: customer });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async createCustomer(req: Request, res: Response): Promise<void> {
    try {
      const { name, phone, email, notes, nailShapePreference, colorPreferences, allergies } = req.body;

      if (!name || !phone) {
        res.status(400).json({ success: false, message: 'Nama dan nomor telepon pelanggan wajib diisi.' });
        return;
      }

      const existing = await prisma.customer.findUnique({ where: { phone } });
      if (existing) {
        res.status(400).json({ success: false, message: 'Nomor telepon sudah terdaftar untuk pelanggan lain.' });
        return;
      }

      const customer = await prisma.customer.create({
        data: {
          name,
          phone,
          email,
          notes,
          nailShapePreference,
          colorPreferences,
          allergies,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Data pelanggan berhasil disimpan.',
        data: customer,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateCustomer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, phone, email, notes, nailShapePreference, colorPreferences, allergies, loyaltyPoints } = req.body;

      const updated = await prisma.customer.update({
        where: { id },
        data: {
          name,
          phone,
          email,
          notes,
          nailShapePreference,
          colorPreferences,
          allergies,
          loyaltyPoints: loyaltyPoints !== undefined ? Number(loyaltyPoints) : undefined,
        },
      });

      res.json({ success: true, message: 'Profil pelanggan diperbarui.', data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
