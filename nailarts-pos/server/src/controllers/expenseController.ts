import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import prisma from '../config/db';

export class ExpenseController {
  /**
   * GET /api/expenses
   */
  static async getExpenses(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { category, startDate, endDate } = req.query;
      const whereClause: any = {};

      if (category) whereClause.category = String(category);
      if (startDate && endDate) {
        whereClause.date = {
          gte: String(startDate),
          lte: String(endDate),
        };
      }

      const expenses = await prisma.expense.findMany({
        where: whereClause,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        include: {
          createdByUser: { select: { id: true, name: true, email: true } },
        },
      });

      const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

      res.json({
        success: true,
        data: expenses,
        meta: {
          totalCount: expenses.length,
          totalAmount,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /api/expenses
   */
  static async createExpense(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { category = 'SUPPLIES', date, description, amount, receiptImage } = req.body;

      if (!description || !amount || Number(amount) <= 0) {
        res.status(400).json({ success: false, message: 'Deskripsi dan nominal pengeluaran wajib diisi.' });
        return;
      }

      const expenseDate = date ? String(date) : new Date().toISOString().slice(0, 10);
      let createdByUserId: string | null = null;
      if (req.user?.id) {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (user) {
          createdByUserId = user.id;
        } else {
          const admin = await prisma.user.findFirst();
          createdByUserId = admin ? admin.id : null;
        }
      }

      const expense = await prisma.expense.create({
        data: {
          category: (category as any) || 'OTHER',
          date: expenseDate,
          description: String(description),
          amount: Number(amount),
          receiptImage: receiptImage ? String(receiptImage) : null,
          createdByUserId,
        },
        include: {
          createdByUser: { select: { id: true, name: true } },
        },
      });

      // Audit Log
      if (createdByUserId) {
        await prisma.auditLog.create({
          data: {
            userId: createdByUserId,
            action: 'CREATE_EXPENSE',
            entity: 'Expense',
            entityId: expense.id,
            newValuesJson: JSON.stringify({ category, amount, description }),
          },
        }).catch(() => null);
      }

      res.status(201).json({
        success: true,
        message: 'Pengeluaran operasional berhasil dicatat.',
        data: expense,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * DELETE /api/expenses/:id
   */
  static async deleteExpense(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      await prisma.expense.delete({ where: { id } });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id ? String(req.user.id) : null,
          action: 'DELETE_EXPENSE',
          entity: 'Expense',
          entityId: id,
        },
      });

      res.json({ success: true, message: 'Catatan pengeluaran berhasil dihapus.' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
