import { Router } from 'express';
import { authenticate, requireRoles } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  userIdParamsSchema,
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  userQuerySchema
} from '../validators/auth.validators';
import { updateRiderAvailabilitySchema } from '../validators/misc.validators';
import * as userController from '../controllers/user.controller';
import { ROLES } from '../config/constants';

const router = Router();
router.use(authenticate);

// Own profile
router.put('/me', validate(updateUserSchema), userController.updateMe);

// Rider availability self-service
router.put(
  '/me/availability',
  requireRoles(ROLES.RIDER),
  validate(updateRiderAvailabilitySchema),
  userController.updateRiderAvailability
);
router.get('/riders/available', requireRoles(ROLES.RESTAFF, ROLES.ADMIN), userController.listAvailableRiders);
router.get('/riders', requireRoles(ROLES.ADMIN, ROLES.RESTAFF), userController.listRiders);
router.get('/riders/:id', requireRoles(ROLES.ADMIN, ROLES.RESTAFF), validate(userIdParamsSchema, 'params'), userController.getRider);
router.put('/riders/:id', requireRoles(ROLES.ADMIN), validate(userIdParamsSchema, 'params'), userController.updateRider);

// Admin user management
router.use(requireRoles(ROLES.ADMIN));
router.get('/', validate(userQuerySchema, 'query'), userController.listUsers);
router.post('/', validate(createUserSchema), userController.createUser);
router.get('/:id', validate(userIdParamsSchema, 'params'), userController.getUser);
router.put('/:id', validate(userIdParamsSchema, 'params'), validate(updateUserSchema), userController.updateUser);
router.put('/:id/status', validate(userIdParamsSchema, 'params'), validate(updateUserStatusSchema), userController.updateUserStatus);

export default router;