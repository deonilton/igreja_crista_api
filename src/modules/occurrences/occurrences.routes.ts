import { Router } from 'express';
import { OccurrenceController } from './OccurrenceController';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { authorizeResource } from '../../shared/middlewares/role.middleware';

const router = Router();
const occurrenceController = new OccurrenceController();

router.use(authMiddleware);
router.use(authorizeResource('ocorrencias'));

// POST /api/occurrences - Criar nova ocorrência
router.post('/', occurrenceController.createOccurrence.bind(occurrenceController));

// GET /api/occurrences - Listar todas as ocorrências (com paginação)
router.get('/', occurrenceController.getAllOccurrences.bind(occurrenceController));

// GET /api/occurrences/:id - Buscar ocorrência por ID
router.get('/:id', occurrenceController.getOccurrenceById.bind(occurrenceController));

// PUT /api/occurrences/:id - Atualizar ocorrência
router.put('/:id', occurrenceController.updateOccurrence.bind(occurrenceController));

// DELETE /api/occurrences/:id - Excluir ocorrência
router.delete('/:id', occurrenceController.deleteOccurrence.bind(occurrenceController));

export default router;
