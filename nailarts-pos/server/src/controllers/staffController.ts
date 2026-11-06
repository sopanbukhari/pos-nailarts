import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { CommissionService } from '../services/commissionService';

export class StaffController {
  static async getStaff(req: Request, res: Response): Promise<void> {
    try {
      const { role } = req.query;
      const whereClause: any = {};
      if (role) whereClause.role = String(role);

      const staff = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          commissionRate: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
      });

      res.json({ success: true, data: staff });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getCommissions(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const summary = await CommissionService.getArtistCommissionSummary(
        startDate ? String(startDate) : undefined,
        endDate ? String(endDate) : undefined
      );

      res.json({ success: true, data: summary });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateStaff(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, phone, commissionRate, isActive, role } = req.body;

      const updated = await prisma.user.update({
        where: { id },
        data: {
          name,
          phone,
          role,
          commissionRate: commissionRate !== undefined ? Number(commissionRate) : undefined,
          isActive,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          commissionRate: true,
          isActive: true,
        },
      });

      res.json({ success: true, message: 'Data staf berhasil diperbarui.', data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
