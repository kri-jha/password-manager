import { Router } from 'express';
import { categoryController } from '../controllers/category.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema
} from '../validators/category.schema.js';

const router = Router();

// All category routes require authentication
router.use(authenticate);

router.get('/', categoryController.getCategories);
router.post('/', validate(createCategorySchema), categoryController.createCategory);
router.patch('/:id', validate(updateCategorySchema), categoryController.updateCategory);
router.delete('/:id', validate(categoryIdParamSchema), categoryController.deleteCategory);

export default router;
