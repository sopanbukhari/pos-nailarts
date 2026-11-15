import { Router } from 'express';
import { ExpenseController } from '../controllers/expenseController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, ExpenseController.getExpenses);
router.post('/', authenticate, ExpenseController.createExpense);
router.delete('/:id', authenticate, ExpenseController.deleteExpense);

export default router;
