import { Router } from 'express';
import { StaffController } from '../controllers/staffController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, StaffController.getStaff);
router.get('/commissions', authenticate, StaffController.getCommissions);
router.put('/:id', authenticate, authorize(['ADMIN']), StaffController.updateStaff);

export default router;
