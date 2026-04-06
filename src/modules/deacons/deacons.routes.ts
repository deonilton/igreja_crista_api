// Deacons Routes
import { Router } from 'express';
import deaconsController from './deacons.controller';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { authorizeMinistry } from '../../shared/middlewares/role.middleware';

const router = Router();

router.use(authMiddleware);
router.use(authorizeMinistry('diaconia'));

router.get('/', (req, res) => deaconsController.findAll(req, res));
router.get('/statistics', (req, res) => deaconsController.getStatistics(req, res));
router.get('/search-members', (req, res) => deaconsController.searchMembers(req, res));
router.get('/:id', (req, res) => deaconsController.findById(req, res));
router.post('/', (req, res) => deaconsController.create(req, res));
router.put('/:id', (req, res) => deaconsController.update(req, res));
router.delete('/:id', (req, res) => deaconsController.delete(req, res));

export default router;
