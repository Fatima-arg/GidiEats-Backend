import { Router } from 'express';
import { authenticate, requireRoles } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  restaurantQuerySchema,
  restaurantParamsSchema,
  createRestaurantSchema,
  updateRestaurantSchema,
  updateRestaurantStatusSchema
} from '../validators/restaurant.validators';
import * as restaurantController from '../controllers/restaurant.controller';
import { ROLES } from '../config/constants';

const router = Router();

// Public
router.get('/', validate(restaurantQuerySchema, 'query'), restaurantController.listRestaurants);
router.get('/:id/menu', validate(restaurantParamsSchema, 'params'), restaurantController.getMenu);
router.get('/:id', validate(restaurantParamsSchema, 'params'), restaurantController.getRestaurant);

// Write operations (admin or restaurant staff of that restaurant)
router.use(authenticate);
router.post(
  '/',
  requireRoles(ROLES.ADMIN, ROLES.RESTAFF),
  validate(createRestaurantSchema),
  restaurantController.createRestaurant
);
router.put(
  '/:id',
  requireRoles(ROLES.ADMIN, ROLES.RESTAFF),
  validate(restaurantParamsSchema, 'params'),
  validate(updateRestaurantSchema),
  restaurantController.updateRestaurant
);
router.put(
  '/:id/status',
  requireRoles(ROLES.ADMIN),
  validate(restaurantParamsSchema, 'params'),
  validate(updateRestaurantStatusSchema),
  restaurantController.updateRestaurantStatus
);

export default router;