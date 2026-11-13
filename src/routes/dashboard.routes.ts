import { Router } from 'express';
import { authenticate, requireRoles } from '../middlewares/auth';
import * as dashboardController from '../controllers/dashboard.controller';
import { ROLES } from '../config/constants';

const router = Router();
router.use(authenticate);
router.get('/', dashboardController.getDashboard);
router.get('/reports', requireRoles(ROLES.ADMIN), dashboardController.getReports);

export default router;