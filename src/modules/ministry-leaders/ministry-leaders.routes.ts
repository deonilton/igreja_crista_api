import { Router } from 'express';
import { ministryLeadersController } from './ministry-leaders.controller';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { authorizeResource, checkSuperAdmin } from '../../shared/middlewares/role.middleware';

const router = Router();

router.use(authMiddleware);

// Get all ministries with their leaders
router.get('/leaders', authorizeResource('ministerios'), ministryLeadersController.getMinistriesWithLeaders);

// Get leaders of a specific ministry
router.get('/:ministryId/leaders', authorizeResource('ministerios'), ministryLeadersController.getMinistryLeaders);

// Add leader to ministry
router.post('/leaders', checkSuperAdmin, ministryLeadersController.addLeader);

// Update leader
router.put('/leaders/:id', checkSuperAdmin, ministryLeadersController.updateLeader);

// Remove leader
router.delete('/leaders/:id', checkSuperAdmin, ministryLeadersController.removeLeader);

// Search members for autocomplete
router.get('/members/search', authorizeResource('ministerios'), ministryLeadersController.searchMembers);

// Get member leaderships
router.get('/members/:memberId/leaderships', authorizeResource('ministerios'), ministryLeadersController.getMemberLeaderships);

export default router;
