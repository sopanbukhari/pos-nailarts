import { Router } from 'express';
import { CatalogController } from '../controllers/catalogController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/categories', authenticate, CatalogController.getCategories);
router.get('/services', authenticate, CatalogController.getServices);
router.post('/services', authenticate, authorize(['ADMIN']), CatalogController.createService);
router.put('/services/:id', authenticate, authorize(['ADMIN']), CatalogController.updateService);

export default router;
