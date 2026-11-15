import { Router } from 'express';
import { InventoryController } from '../controllers/inventoryController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, InventoryController.getItems);
router.get('/movements', authenticate, InventoryController.getMovements);
router.post('/', authenticate, InventoryController.createItem);
router.patch('/:id/stock', authenticate, InventoryController.updateStock);

export default router;
