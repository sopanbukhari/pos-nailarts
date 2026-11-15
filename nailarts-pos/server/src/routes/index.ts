import { Router } from 'express';
import authRoutes from './authRoutes';
import posRoutes from './posRoutes';
import bookingRoutes from './bookingRoutes';
import catalogRoutes from './catalogRoutes';
import customerRoutes from './customerRoutes';
import inventoryRoutes from './inventoryRoutes';
import staffRoutes from './staffRoutes';
import reportRoutes from './reportRoutes';
import expenseRoutes from './expenseRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/pos', posRoutes);
router.use('/bookings', bookingRoutes);
router.use('/catalog', catalogRoutes);
router.use('/customers', customerRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/staff', staffRoutes);
router.use('/reports', reportRoutes);
router.use('/expenses', expenseRoutes);

export default router;
