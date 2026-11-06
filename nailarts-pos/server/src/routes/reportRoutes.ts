import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/summary', authenticate, ReportController.getSummary);
router.get('/top-services', authenticate, ReportController.getTopServices);
router.get('/weekly', authenticate, ReportController.getWeeklyRevenue);
router.get('/revenue', authenticate, ReportController.getRevenueReport);

export default router;
