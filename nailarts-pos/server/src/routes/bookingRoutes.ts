import { Router } from 'express';
import { BookingController } from '../controllers/bookingController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, BookingController.getBookings);
router.post('/', authenticate, BookingController.createBooking);
router.patch('/:id/status', authenticate, BookingController.updateStatus);

export default router;
