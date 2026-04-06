// Small Family Reports Routes
import { Router } from 'express';
import smallFamilyReportsController from './small-family-reports.controller';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { authorizeMinistry } from '../../shared/middlewares/role.middleware';

const router = Router();

router.use(authMiddleware);
router.use(authorizeMinistry('pequenas_familias'));

router.get('/', (req, res) => smallFamilyReportsController.findAll(req, res));
router.get('/family/:familyId', (req, res) => smallFamilyReportsController.findByFamilyId(req, res));
router.get('/:id', (req, res) => smallFamilyReportsController.findById(req, res));
router.post('/', (req, res) => smallFamilyReportsController.create(req, res));
router.put('/:id', (req, res) => smallFamilyReportsController.update(req, res));
router.delete('/:id', (req, res) => smallFamilyReportsController.delete(req, res));

export default router;
