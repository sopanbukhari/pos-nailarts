import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { PosService } from '../services/posService';
import prisma from '../config/db';

export class PosController {
  /**
   * POST /api/pos/checkout
   */
  static async checkout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const cashierId = req.user?.id || req.body.cashierId;
      if (!cashierId) {
        res.status(400).json({ success: false, message: 'ID Kasir tidak valid.' });
        return;
      }

      const transaction = await PosService.processCheckout({
        ...req.body,
        cashierId,
      });

      res.status(201).json({
        success: true,
        message: 'Transaksi berhasil diselesaikan.',
        data: transaction,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /api/pos/transactions
   */
  static async getTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { limit = 50, page = 1, status, date } = req.query;
      const take = Number(limit);
      const skip = (Number(page) - 1) * take;

      const whereClause: any = {};
      if (status) whereClause.status = String(status);
      if (date) {
        const start = new Date(String(date));
        start.setHours(0, 0, 0, 0);
        const end = new Date(String(date));
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt = { gte: start, lte: end };
      }

      const [total, transactions] = await Promise.all([
        prisma.transaction.count({ where: whereClause }),
        prisma.transaction.findMany({
          where: whereClause,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
            customer: true,
            cashier: { select: { id: true, name: true } },
            artist: { select: { id: true, name: true } },
          },
        }),
      ]);

      res.json({
        success: true,
        data: transactions,
        meta: { total, page: Number(page), limit: take },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /api/pos/transactions/:id
   */
  static async getTransactionById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const transaction = await prisma.transaction.findUnique({
        where: { id },
        include: {
          items: true,
          customer: true,
          cashier: { select: { id: true, name: true, email: true } },
          artist: { select: { id: true, name: true, phone: true } },
        },
      });

      if (!transaction) {
        res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
        return;
      }

      res.json({ success: true, data: transaction });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
