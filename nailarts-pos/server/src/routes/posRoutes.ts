import { Router } from 'express';
import { PosController } from '../controllers/posController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/checkout', authenticate, PosController.checkout);
router.get('/transactions', authenticate, PosController.getTransactions);
router.get('/transactions/:id', authenticate, PosController.getTransactionById);
router.post('/transactions/:id/refund', authenticate, PosController.refund);

export default router;
