import { Router } from 'express';
import { authenticate, optionalAuth, requireRoles } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  idParamsSchema,
  orderQuerySchema,
  createOrderSchema,
  cancelOrderSchema,
  updateOrderStatusSchema,
  assignRiderSchema,
  orderNumberParamsSchema,
  trackOrderSchema,
  guestHistorySchema,
  confirmReceiptSchema,
  rateOrderSchema
} from '../validators/order.validators';
import * as orderController from '../controllers/order.controller';
import { ROLES } from '../config/constants';

const router = Router();

// Public: guests can place an order (with delivery details), track it and see their history
router.post('/track', validate(trackOrderSchema), orderController.trackOrder);
router.get('/track/:orderNumber', validate(orderNumberParamsSchema, 'params'), orderController.trackOrderByNumber);
router.post('/track/history', validate(guestHistorySchema), orderController.guestOrderHistory);
router.post(
  '/:id/confirm-receipt',
  optionalAuth,
  validate(idParamsSchema, 'params'),
  validate(confirmReceiptSchema),
  orderController.confirmReceipt
);
router.post('/', optionalAuth, validate(createOrderSchema), orderController.createOrder);

router.use(authenticate);

router.get('/', validate(orderQuerySchema, 'query'), orderController.listOrders);

router.get('/:id', validate(idParamsSchema, 'params'), orderController.getOrder);
router.post('/:id/rating', validate(idParamsSchema, 'params'), validate(rateOrderSchema), orderController.rateOrder);
router.put(
  '/:id/status',
  validate(idParamsSchema, 'params'),
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus
);
router.post(
  '/:id/assign-rider',
  requireRoles(ROLES.RESTAFF, ROLES.ADMIN),
  validate(idParamsSchema, 'params'),
  validate(assignRiderSchema),
  orderController.assignRider
);
router.post(
  '/:id/claim-delivery',
  requireRoles(ROLES.RIDER),
  validate(idParamsSchema, 'params'),
  orderController.claimDelivery
);
router.post(
  '/:id/cancel',
  validate(idParamsSchema, 'params'),
  validate(cancelOrderSchema),
  orderController.cancelOrder
);

export default router;