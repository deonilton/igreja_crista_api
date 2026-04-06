import { Router } from 'express';
import { CultReportController } from './CultReportController';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { authorizeMinistry } from '../../shared/middlewares/role.middleware';

const router = Router();
const cultReportController = new CultReportController();

router.use(authMiddleware);
router.use(authorizeMinistry('diaconia'));

router.post('/', (req, res) => cultReportController.createCultReport(req, res));
router.get('/', (req, res) => cultReportController.getAllCultReports(req, res));
router.get('/:id', (req, res) => cultReportController.getCultReportById(req, res));
router.put('/:id', (req, res) => cultReportController.updateCultReport(req, res));
router.delete('/:id', (req, res) => cultReportController.deleteCultReport(req, res));

export default router;
