import { Router } from 'express';
import { StaffController } from '../controllers/staffController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, StaffController.getStaff);
router.get('/commissions', authenticate, StaffController.getCommissions);
router.post('/commissions/:employeeId/payout', authenticate, StaffController.payoutCommissions);
router.put('/:id', authenticate, StaffController.updateStaff);

export default router;
