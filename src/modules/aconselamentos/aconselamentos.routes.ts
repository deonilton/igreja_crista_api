import { Router } from 'express';
import { AconselhamentoController } from './AconselhamentoController';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { authorizeResource } from '../../shared/middlewares/role.middleware';

const router = Router();
const controller = new AconselhamentoController();

router.use(authMiddleware);
router.use(authorizeResource('aconselhamentos'));

router.post('/', (req, res) => controller.createAconselhamento(req, res));
router.get('/', (req, res) => controller.getAllAconselhamentos(req, res));
router.get('/:id', (req, res) => controller.getAconselhamentoById(req, res));
router.put('/:id', (req, res) => controller.updateAconselhamento(req, res));
router.delete('/:id', (req, res) => controller.deleteAconselhamento(req, res));

export default router;
