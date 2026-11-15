import { Request, Response } from 'express';
import prisma from '../config/db';

export class CustomerController {
  static async getCustomers(req: Request, res: Response): Promise<void> {
    try {
      const { search } = req.query;
      const whereClause: any = {};

      if (search) {
        whereClause.OR = [
          { name: { contains: String(search), mode: 'insensitive' } },
          { phone: { contains: String(search), mode: 'insensitive' } },
        ];
      }

      const customers = await prisma.customer.findMany({
        where: whereClause,
        orderBy: { updatedAt: 'desc' },
        include: {
          sales: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: { items: true, payments: true },
          },
          appointments: {
            take: 3,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      // Backward compatibility aliases
      const mapped = customers.map((c: any) => ({
        ...c,
        transactions: (c.sales || []).map((s: any) => ({
          ...s,
          total: s.totalAmount,
          paymentMethod: s.payments?.[0]?.paymentMethod || 'CASH',
        })),
        bookings: c.appointments || [],
      }));

      res.json({ success: true, data: mapped });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getCustomerById(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const customer: any = await prisma.customer.findUnique({
        where: { id },
        include: {
          sales: {
            orderBy: { createdAt: 'desc' },
            include: { items: true, payments: true },
          },
          appointments: {
            orderBy: { createdAt: 'desc' },
            include: {
              employee: { include: { user: true } },
              services: { include: { service: true } },
            },
          },
        },
      });

      if (!customer) {
        res.status(404).json({ success: false, message: 'Pelanggan tidak ditemukan.' });
        return;
      }

      const mapped = {
        ...customer,
        transactions: (customer.sales || []).map((s: any) => ({
          ...s,
          total: s.totalAmount,
          paymentMethod: s.payments?.[0]?.paymentMethod || 'CASH',
        })),
        bookings: (customer.appointments || []).map((a: any) => ({
          ...a,
          artist: a.employee?.user,
        })),
      };

      res.json({ success: true, data: mapped });
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

      const existing = await prisma.customer.findUnique({ where: { phone: String(phone) } });
      if (existing) {
        res.status(400).json({ success: false, message: 'Nomor telepon sudah terdaftar untuk pelanggan lain.' });
        return;
      }

      const customer = await prisma.customer.create({
        data: {
          name: String(name),
          phone: String(phone),
          email: email ? String(email) : null,
          notes: notes ? String(notes) : null,
          nailShapePreference: nailShapePreference ? String(nailShapePreference) : null,
          colorPreferences: colorPreferences ? String(colorPreferences) : null,
          allergies: allergies ? String(allergies) : null,
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
      const id = String(req.params.id);
      const { name, phone, email, notes, nailShapePreference, colorPreferences, allergies } = req.body;

      const updated = await prisma.customer.update({
        where: { id },
        data: {
          ...(name ? { name: String(name) } : {}),
          ...(phone ? { phone: String(phone) } : {}),
          ...(email !== undefined ? { email: email ? String(email) : null } : {}),
          ...(notes !== undefined ? { notes: notes ? String(notes) : null } : {}),
          ...(nailShapePreference !== undefined ? { nailShapePreference: nailShapePreference ? String(nailShapePreference) : null } : {}),
          ...(colorPreferences !== undefined ? { colorPreferences: colorPreferences ? String(colorPreferences) : null } : {}),
          ...(allergies !== undefined ? { allergies: allergies ? String(allergies) : null } : {}),
        },
      });

      res.json({ success: true, message: 'Data pelanggan berhasil diperbarui.', data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
