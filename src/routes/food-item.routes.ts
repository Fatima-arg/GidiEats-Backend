import { Router } from 'express';
import { authenticate, requireRoles } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  foodItemQuerySchema,
  idParamsSchema,
  createFoodItemSchema,
  updateFoodItemSchema
} from '../validators/menu.validators';
import * as foodItemController from '../controllers/food-item.controller';
import { uploadImage } from '../config/multer';
import { ROLES } from '../config/constants';

const router = Router();

// Public browsing
router.get('/', validate(foodItemQuerySchema, 'query'), foodItemController.listFoodItemsPublic);
router.get('/:id', validate(idParamsSchema, 'params'), foodItemController.getFoodItem);

// Restaurant staff / admin manage the menu
router.use(authenticate, requireRoles(ROLES.RESTAFF, ROLES.ADMIN));
router.get('/admin/items', validate(foodItemQuerySchema, 'query'), foodItemController.listFoodItems);

router.post('/', uploadImage.single('image'), validate(createFoodItemSchema), foodItemController.createFoodItem);
router.put('/:id', uploadImage.single('image'), validate(idParamsSchema, 'params'), validate(updateFoodItemSchema), foodItemController.updateFoodItem);
router.delete('/:id', validate(idParamsSchema, 'params'), foodItemController.deleteFoodItem);

export default router;