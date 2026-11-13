import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRoles } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { uploadImage } from '../config/multer';
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

const handleRestaurantUploads = (req: Request, _res: Response, next: NextFunction) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  if (files?.logo?.[0]) req.body.logo = `/uploads/${files.logo[0].filename}`;
  if (files?.coverImage?.[0]) req.body.coverImage = `/uploads/${files.coverImage[0].filename}`;
  next();
};

// Public
router.get('/', validate(restaurantQuerySchema, 'query'), restaurantController.listRestaurants);
router.get('/:id/menu', validate(restaurantParamsSchema, 'params'), restaurantController.getMenu);
router.get('/:id', validate(restaurantParamsSchema, 'params'), restaurantController.getRestaurant);

// Write operations (admin or restaurant staff of that restaurant)
router.use(authenticate);
router.post(
  '/',
  requireRoles(ROLES.ADMIN, ROLES.RESTAFF),
  uploadImage.fields([{ name: 'logo', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]),
  handleRestaurantUploads,
  validate(createRestaurantSchema),
  restaurantController.createRestaurant
);
router.put(
  '/:id',
  requireRoles(ROLES.ADMIN, ROLES.RESTAFF),
  uploadImage.fields([{ name: 'logo', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]),
  handleRestaurantUploads,
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