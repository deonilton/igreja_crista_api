// Users Routes
import { Router } from 'express';
import usersController from './users.controller';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { authorizeResource } from '../../shared/middlewares/role.middleware';

const router = Router();

router.use(authMiddleware);
router.use(authorizeResource('usuarios'));

router.get('/', (req, res) => usersController.findAll(req, res));
router.post('/', (req, res) => usersController.create(req, res));
router.put('/:id', (req, res) => usersController.update(req, res));
router.delete('/:id', (req, res) => usersController.delete(req, res));

export default router;
