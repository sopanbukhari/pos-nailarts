import { Request, Response } from 'express';
import { ReportService } from '../services/reportService';

export class ReportController {
  static async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await ReportService.getSummaryStats();
      res.json({ success: true, data: summary });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getTopServices(req: Request, res: Response): Promise<void> {
    try {
      const { limit } = req.query;
      const topServices = await ReportService.getTopServices(limit ? Number(limit) : 5);
      res.json({ success: true, data: topServices });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getRevenuePerTechnician(req: Request, res: Response): Promise<void> {
    try {
      const data = await ReportService.getRevenuePerTechnician();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getPaymentMethodDistribution(req: Request, res: Response): Promise<void> {
    try {
      const data = await ReportService.getPaymentMethodDistribution();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getPeriodicReport(req: Request, res: Response): Promise<void> {
    try {
      const { period = 'daily' } = req.query;
      const data = await ReportService.getPeriodicReport(period as any);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getProfitAndLoss(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const data = await ReportService.getProfitAndLoss(
        startDate ? String(startDate) : undefined,
        endDate ? String(endDate) : undefined
      );
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const { limit } = req.query;
      const data = await ReportService.getAuditLogs(limit ? Number(limit) : 50);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
