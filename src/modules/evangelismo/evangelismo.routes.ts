import { Router } from 'express';
import evangelismoController from './evangelismo.controller';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { authorizeMinistry } from '../../shared/middlewares/role.middleware';

const router = Router();

router.use(authMiddleware);
router.use(authorizeMinistry('evangelismo'));

// Líderes de Evangelismo
router.get('/leaders', (req, res) => evangelismoController.findAllLeaders(req, res));
router.get('/leaders/:id', (req, res) => evangelismoController.findLeaderById(req, res));
router.post('/leaders', (req, res) => evangelismoController.createLeader(req, res));
router.put('/leaders/:id', (req, res) => evangelismoController.updateLeader(req, res));
router.delete('/leaders/:id', (req, res) => evangelismoController.deleteLeader(req, res));

// Estatísticas
router.get('/statistics', (req, res) => evangelismoController.getStatistics(req, res));

// Busca de membros
router.get('/search-members', (req, res) => evangelismoController.searchMembers(req, res));

// Casas de Paz
router.get('/casas-de-paz', (req, res) => evangelismoController.findAllCasasDePaz(req, res));
router.get('/casas-de-paz/:id', (req, res) => evangelismoController.findCasaDePazById(req, res));
router.post('/casas-de-paz', (req, res) => evangelismoController.createCasaDePaz(req, res));

// Relatórios de Evangelismo
router.get('/reports', (req, res) => evangelismoController.findAllReports(req, res));
router.get('/reports/:id', (req, res) => evangelismoController.findReportById(req, res));
router.post('/reports', (req, res) => evangelismoController.createReport(req, res));
router.put('/reports/:id', (req, res) => evangelismoController.updateReport(req, res));
router.delete('/reports/:id', (req, res) => evangelismoController.deleteReport(req, res));

export default router;
