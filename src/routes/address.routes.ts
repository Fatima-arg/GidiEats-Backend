import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  addressQuerySchema,
  addressParamsSchema,
  createAddressSchema,
  updateAddressSchema
} from '../validators/misc.validators';
import * as addressController from '../controllers/address.controller';

const router = Router();
router.use(authenticate);

router.get('/', validate(addressQuerySchema, 'query'), addressController.listAddresses);
router.post('/', validate(createAddressSchema), addressController.createAddress);
router.put('/:id', validate(addressParamsSchema, 'params'), validate(updateAddressSchema), addressController.updateAddress);
router.delete('/:id', validate(addressParamsSchema, 'params'), addressController.deleteAddress);

export default router;