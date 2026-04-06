export type AppRole = 'super_admin' | 'admin' | 'lider' | 'colaborador' | 'membro';

export type PermissionResource =
  | 'dashboard'
  | 'membros'
  | 'usuarios'
  | 'lideranca'
  | 'pastoral_room'
  | 'ocorrencias'
  | 'aconselhamentos'
  | 'ministerios';

export interface JwtAuthPayload {
  id: number;
  role: string;
  ministries?: string[];
}

// Matriz central de permissões por role.
// "*" representa acesso total a todos os recursos.
export const permissions: Record<AppRole, Array<PermissionResource | '*'>> = {
  super_admin: ['*'],
  admin: ['dashboard', 'ministerios'],
  lider: ['dashboard', 'ministerios'],
  colaborador: ['dashboard', 'ministerios'],
  membro: ['dashboard'],
};

const roleAliases: Record<string, AppRole> = {
  super_admin: 'super_admin',
  admin: 'admin',
  lider: 'lider',
  colaborador: 'colaborador',
  membro: 'membro',
};

export function normalizeRole(role?: string): AppRole | null {
  if (!role) {
    return null;
  }

  const normalized = role.trim().toLowerCase();
  return roleAliases[normalized] || null;
}

export function hasPermission(role: string | undefined, resource: PermissionResource): boolean {
  const normalizedRole = normalizeRole(role);

  if (!normalizedRole) {
    return false;
  }

  const allowedResources = permissions[normalizedRole];
  return allowedResources.includes('*') || allowedResources.includes(resource);
}

export function hasMinistryAccess(role: string | undefined, userMinistries: string[] = [], ministry: string): boolean {
  if (hasPermission(role, 'ministerios') === false && hasPermission(role, 'usuarios') === false) {
    return false;
  }

  const normalizedRole = normalizeRole(role);
  if (normalizedRole === 'super_admin') {
    return true;
  }

  return userMinistries.includes(ministry);
}
