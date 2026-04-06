import { Router } from 'express';
import pastoralRoomController from './pastoral-room.controller';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { authorizeResource } from '../../shared/middlewares/role.middleware';

const router = Router();

router.use(authMiddleware);
router.use(authorizeResource('pastoral_room'));

// GET /api/pastoral-room - Buscar todos os relatórios e ocorrências para a Sala Pastoral
router.get('/', pastoralRoomController.getAllReportsAndOccurrences.bind(pastoralRoomController));

export default router;
