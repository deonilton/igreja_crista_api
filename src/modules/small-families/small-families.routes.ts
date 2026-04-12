// Small Families Routes
import { Router } from 'express';
import smallFamiliesController from './small-families.controller';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { authorizeMinistry } from '../../shared/middlewares/role.middleware';

const router = Router();

router.use(authMiddleware);
router.use(authorizeMinistry('pequenas_familias'));

router.get('/', (req, res) => smallFamiliesController.findAll(req, res));
router.get('/statistics', (req, res) => smallFamiliesController.getStatistics(req, res));
router.get('/full-families', (req, res) => smallFamiliesController.getAllFullFamilies(req, res));
router.get('/search-members', (req, res) => smallFamiliesController.searchMembers(req, res));
router.get('/:id', (req, res) => smallFamiliesController.findById(req, res));
router.post('/', (req, res) => smallFamiliesController.create(req, res));
router.post('/create', (req, res) => smallFamiliesController.createFullFamily(req, res));
router.put('/:id', (req, res) => smallFamiliesController.update(req, res));
router.delete('/full-families/:id', (req, res) => smallFamiliesController.deleteFullFamily(req, res));
router.delete('/:id', (req, res) => smallFamiliesController.delete(req, res));

export default router;
