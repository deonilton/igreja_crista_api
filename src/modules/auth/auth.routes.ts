// Auth Routes - Definição das rotas
import { Router, Request, Response } from 'express';
import authController from './auth.controller';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import { AuthRequest } from './auth.types';

const router = Router();

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => authController.login(req, res));

// POST /api/auth/forgot-password
router.post('/forgot-password', (req: Request, res: Response) => authController.forgotPassword(req, res));

// POST /api/auth/reset-password
router.post('/reset-password', (req: Request, res: Response) => authController.resetPassword(req, res));

// GET /api/auth/me
router.get('/me', authMiddleware, (req: Request, res: Response) => authController.getMe(req as AuthRequest, res));

export default router;
