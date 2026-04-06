// Dashboard Routes
import { Router } from 'express';
import dashboardController from './dashboard.controller';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { authorizeResource } from '../../shared/middlewares/role.middleware';

const router = Router();

router.use(authMiddleware);
router.use(authorizeResource('dashboard'));

router.get('/', (req, res) => dashboardController.getDashboard(req, res));

export default router;
