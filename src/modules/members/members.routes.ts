// Members Routes
import { Router } from 'express';
import membersController from './members.controller';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { authorizeResource, checkMemberEditAccess } from '../../shared/middlewares/role.middleware';

const router = Router();

router.use(authMiddleware);
router.use(authorizeResource('membros'));

router.get('/age-ranges', (req, res) => membersController.getAgeRanges(req, res));
router.get('/', (req, res) => membersController.findAll(req, res));
router.get('/:id', (req, res) => membersController.findById(req, res));
router.post('/', (req, res) => membersController.create(req, res));
router.put('/:id', checkMemberEditAccess, (req, res) => membersController.update(req, res));
router.delete('/:id', checkMemberEditAccess, (req, res) => membersController.delete(req, res));

export default router;
