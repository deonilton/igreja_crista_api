// Auth Middleware - Verificação de JWT
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtAuthPayload } from '../auth/permissions';
import pool from '../database/connection';

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
  userMinistries?: string[];
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    res.status(500).json({ error: 'Configuração de autenticação inválida.' });
    return;
  }

  if (!authHeader) {
    res.status(401).json({ error: 'Token não fornecido.' });
    return;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2) {
    res.status(401).json({ error: 'Erro no formato do token.' });
    return;
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    res.status(401).json({ error: 'Token mal formatado.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] }) as JwtAuthPayload;

    if (!decoded || typeof decoded.id !== 'number' || typeof decoded.role !== 'string') {
      res.status(401).json({ error: 'Token inválido.' });
      return;
    }

    req.userId = decoded.id;
    req.userRole = decoded.role;

    const [ministryRows] = await pool.execute<any[]>(
      `SELECT m.name
       FROM user_ministries um
       INNER JOIN ministries m ON um.ministry_id = m.id
       WHERE um.user_id = ? AND m.is_active = 1`,
      [decoded.id]
    );
    req.userMinistries = ministryRows.map((row: any) => row.name);

    return next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido.' });
  }
}
