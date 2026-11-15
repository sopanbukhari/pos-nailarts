import { Request, Response } from 'express';
import prisma from '../config/db';
import { CommissionService } from '../services/commissionService';

export class StaffController {
  static async getStaff(req: Request, res: Response): Promise<void> {
    try {
      const { role } = req.query;
      const whereClause: any = {};

      if (role) {
        const targetRole = role === 'ADMIN' ? 'OWNER_ADMIN' : String(role);
        whereClause.role = { name: targetRole };
      }

      const users: any[] = await prisma.user.findMany({
        where: whereClause,
        include: {
          role: true,
          employee: {
            include: { schedules: true },
          },
        },
        orderBy: { name: 'asc' },
      });

      const staff = users.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role?.name === 'OWNER_ADMIN' ? 'ADMIN' : (u.role?.name || 'ARTIST'),
        roleDisplayName: u.role?.displayName || u.role?.name,
        phone: u.phone,
        commissionRate: u.employee?.commissionRate || 0,
        isActive: u.isActive,
        employee: u.employee,
        createdAt: u.createdAt,
      }));

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

  static async payoutCommissions(req: Request, res: Response): Promise<void> {
    try {
      const employeeId = String(req.params.employeeId);
      const result = await CommissionService.payoutCommissions(employeeId);
      res.json({
        success: true,
        message: 'Hak komisi berhasil dicairkan (ditandai PAID).',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async updateStaff(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { name, phone, commissionRate, isActive } = req.body;

      const user: any = await prisma.user.findUnique({
        where: { id },
        include: { employee: true },
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'Staf tidak ditemukan.' });
        return;
      }

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id },
          data: {
            ...(name ? { name: String(name) } : {}),
            ...(phone !== undefined ? { phone: phone ? String(phone) : null } : {}),
            isActive: isActive !== undefined ? Boolean(isActive) : undefined,
          },
        });

        if (commissionRate !== undefined) {
          if (user.employee) {
            await tx.employee.update({
              where: { id: user.employee.id },
              data: { commissionRate: Number(commissionRate) },
            });
          } else {
            await tx.employee.create({
              data: {
                userId: user.id,
                employeeNumber: `EMP-NA-${Date.now().toString().slice(-4)}`,
                position: 'Nail Artist Specialist',
                commissionRate: Number(commissionRate),
              },
            });
          }
        }
      });

      const updated: any = await prisma.user.findUnique({
        where: { id },
        include: { role: true, employee: true },
      });

      res.json({
        success: true,
        message: 'Data staf berhasil diperbarui.',
        data: {
          id: updated!.id,
          name: updated!.name,
          email: updated!.email,
          role: updated!.role?.name === 'OWNER_ADMIN' ? 'ADMIN' : updated!.role?.name,
          phone: updated!.phone,
          commissionRate: updated!.employee?.commissionRate || 0,
          isActive: updated!.isActive,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
