import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/summary', authenticate, ReportController.getSummary);
router.get('/top-services', authenticate, ReportController.getTopServices);
router.get('/technicians', authenticate, ReportController.getRevenuePerTechnician);
router.get('/payment-methods', authenticate, ReportController.getPaymentMethodDistribution);
router.get('/periodic', authenticate, ReportController.getPeriodicReport);
router.get('/revenue', authenticate, ReportController.getPeriodicReport);
router.get('/profit-loss', authenticate, ReportController.getProfitAndLoss);
router.get('/profit-and-loss', authenticate, ReportController.getProfitAndLoss);
router.get('/audit-logs', authenticate, ReportController.getAuditLogs);

export default router;
