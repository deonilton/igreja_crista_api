// Public Routes - Rotas públicas (sem autenticação)
import { Router } from 'express';
import publicController from './public.controller';

const router = Router();

// POST /api/public/register - Cadastro público de visitante
router.post('/register', (req, res) => publicController.registerMember(req, res));

export default router;
