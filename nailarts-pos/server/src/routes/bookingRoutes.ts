import { Router } from 'express';
import { BookingController } from '../controllers/bookingController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, BookingController.getBookings);
router.get('/:id', authenticate, BookingController.getBookingById);
router.post('/', authenticate, BookingController.createBooking);
router.put('/:id', authenticate, BookingController.updateBooking);
router.patch('/:id/status', authenticate, BookingController.updateStatus);
router.delete('/:id', authenticate, BookingController.deleteBooking);

export default router;
