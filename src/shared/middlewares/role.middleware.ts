// Role Middleware - Verificação de permissões
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { hasMinistryAccess, hasPermission, normalizeRole, PermissionResource } from '../auth/permissions';

function forbidden(res: Response, message: string): void {
  res.status(403).json({ error: message });
}

export function authorizeResource(resource: PermissionResource) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!hasPermission(req.userRole, resource)) {
      forbidden(res, `Acesso negado ao recurso: ${resource}`);
      return;
    }

    next();
  };
}

export function authorizeMinistry(ministry: string, baseResource: PermissionResource = 'ministerios') {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!hasMinistryAccess(req.userRole, req.userMinistries || [], ministry)) {
      forbidden(res, `Acesso negado ao ministério: ${ministry}`);
      return;
    }

    if (!hasPermission(req.userRole, baseResource)) {
      forbidden(res, `Acesso negado ao recurso: ${baseResource}`);
      return;
    }

    next();
  };
}

export function checkSuperAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (normalizeRole(req.userRole) !== 'super_admin') {
    forbidden(res, 'Acesso negado. Apenas super administradores podem acessar este recurso.');
    return;
  }

  next();
}

export function checkMinistryAccess(ministry: string) {
  return authorizeMinistry(ministry, 'ministerios');
}

export function checkMemberEditAccess(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!hasPermission(req.userRole, 'lideranca')) {
    forbidden(res, 'Acesso negado. Apenas administração e liderança podem editar membros.');
    return;
  }

  next();
}
