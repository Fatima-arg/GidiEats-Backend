import { Router } from 'express';
import { authenticate, optionalAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  paymentsQuerySchema,
  processPaymentSchema,
  orderIdParamsSchema,
  idParamsSchema,
  guestProcessPaymentSchema,
  flwInitiateSchema,
  flwVerifySchema
} from '../validators/order.validators';
import * as paymentController from '../controllers/payment.controller';

const router = Router();

router.post(
  '/guest/orders/:orderId/process',
  validate(orderIdParamsSchema, 'params'),
  validate(guestProcessPaymentSchema),
  paymentController.processGuestPayment
);

// Flutterwave endpoints (usable by both authenticated customers and guests)
router.post(
  '/flutterwave/initiate',
  optionalAuth,
  validate(flwInitiateSchema),
  paymentController.initiateFlutterwave
);

router.post(
  '/flutterwave/verify',
  optionalAuth,
  validate(flwVerifySchema),
  paymentController.verifyFlutterwave
);

router.post(
  '/flutterwave/webhook',
  paymentController.flutterwaveWebhook
);

router.use(authenticate);

router.get('/', validate(paymentsQuerySchema, 'query'), paymentController.listPayments);
router.get('/orders/:orderId', validate(orderIdParamsSchema, 'params'), paymentController.paymentForOrder);
router.post('/orders/:orderId/process', validate(orderIdParamsSchema, 'params'), validate(processPaymentSchema), paymentController.processOrderPayment);
router.get('/:id', validate(idParamsSchema, 'params'), paymentController.getPayment);

export default router;
