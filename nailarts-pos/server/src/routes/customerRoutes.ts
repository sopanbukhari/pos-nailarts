import { Router } from 'express';
import { CustomerController } from '../controllers/customerController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, CustomerController.getCustomers);
router.get('/:id', authenticate, CustomerController.getCustomerById);
router.post('/', authenticate, CustomerController.createCustomer);
router.put('/:id', authenticate, CustomerController.updateCustomer);

export default router;
