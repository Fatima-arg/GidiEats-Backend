import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { notificationsQuerySchema, addressParamsSchema } from '../validators/misc.validators';
import * as notificationController from '../controllers/notification.controller';

const router = Router();
router.use(authenticate);

router.get('/', validate(notificationsQuerySchema, 'query'), notificationController.listNotifications);
router.get('/unread-count', notificationController.unreadCount);
router.put('/read-all', notificationController.markAllRead);
router.put('/:id/read', validate(addressParamsSchema, 'params'), notificationController.markRead);

export default router;