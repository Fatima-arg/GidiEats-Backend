import { Router } from 'express';
import { authenticate, requireRoles } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  categoryQuerySchema,
  idParamsSchema,
  createCategorySchema,
  updateCategorySchema
} from '../validators/menu.validators';
import * as categoryController from '../controllers/category.controller';
import { ROLES } from '../config/constants';

const router = Router();

router.get('/', validate(categoryQuerySchema, 'query'), categoryController.listCategories);
router.get('/:id', validate(idParamsSchema, 'params'), categoryController.getCategory);

router.use(authenticate, requireRoles(ROLES.RESTAFF, ROLES.ADMIN));
router.post('/', validate(createCategorySchema), categoryController.createCategory);
router.put('/:id', validate(idParamsSchema, 'params'), validate(updateCategorySchema), categoryController.updateCategory);
router.delete('/:id', validate(idParamsSchema, 'params'), categoryController.deleteCategory);

export default router;