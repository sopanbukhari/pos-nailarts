import { Request, Response } from 'express';
import { ReportService } from '../services/reportService';

export class ReportController {
  static async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const stats = await ReportService.getSummaryStats();
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getTopServices(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 5;
      const topServices = await ReportService.getTopServices(limit);
      res.json({ success: true, data: topServices });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getWeeklyRevenue(req: Request, res: Response): Promise<void> {
    try {
      const weekly = await ReportService.getWeeklyRevenue();
      res.json({ success: true, data: weekly });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getRevenueReport(req: Request, res: Response): Promise<void> {
    try {
      const period = (req.query.period as any) || 'daily';
      const report = await ReportService.getRevenueReport(period);
      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
