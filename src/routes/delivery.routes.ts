import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { deliveriesQuerySchema, idParamsSchema, updateDeliveryStatusSchema } from '../validators/order.validators';
import * as deliveryController from '../controllers/delivery.controller';

const router = Router();
router.use(authenticate);

router.get('/', validate(deliveriesQuerySchema, 'query'), deliveryController.listDeliveries);
router.get('/:id', validate(idParamsSchema, 'params'), deliveryController.getDelivery);
router.put(
  '/:id/status',
  validate(idParamsSchema, 'params'),
  validate(updateDeliveryStatusSchema),
  deliveryController.updateDeliveryStatus
);

export default router;