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

      const sale = await PosService.processCheckout({
        ...req.body,
        cashierId: String(cashierId),
      });

      res.status(201).json({
        success: true,
        message: 'Transaksi berhasil diselesaikan.',
        data: sale,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /api/pos/transactions (Sales history)
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

      const [total, sales] = await Promise.all([
        prisma.sale.count({ where: whereClause }),
        prisma.sale.findMany({
          where: whereClause,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
            customer: true,
            cashier: { select: { id: true, name: true } },
            employee: { include: { user: { select: { id: true, name: true, phone: true } } } },
            payments: true,
          },
        }),
      ]);

      res.json({
        success: true,
        data: sales,
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
      const id = String(req.params.id);
      const sale = await prisma.sale.findUnique({
        where: { id },
        include: {
          items: true,
          customer: true,
          cashier: { select: { id: true, name: true, email: true } },
          employee: { include: { user: { select: { id: true, name: true, phone: true } } } },
          payments: true,
        },
      });

      if (!sale) {
        res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
        return;
      }

      res.json({ success: true, data: sale });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /api/pos/transactions/:id/refund
   */
  static async refund(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { reason = 'Permintaan pembatalan transaksi' } = req.body;
      const userId = req.user?.id ? String(req.user.id) : 'system';

      const refunded = await PosService.refundSale(id, userId, String(reason));

      res.json({
        success: true,
        message: 'Transaksi berhasil di-refund.',
        data: refunded,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
