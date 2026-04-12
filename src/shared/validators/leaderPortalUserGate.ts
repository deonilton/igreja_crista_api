// Garante que líderes de ministério tenham usuário no painel (mesmo e-mail do membro),
// com perfil que acessa ministérios e vínculo ao ministério em questão.
import pool from '../database/connection';
import { hasPermission } from '../auth/permissions';

export class LeaderPortalAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LeaderPortalAccessError';
    Object.setPrototypeOf(this, LeaderPortalAccessError.prototype);
  }
}

export function isLeaderPortalAccessError(err: unknown): err is LeaderPortalAccessError {
  return err instanceof LeaderPortalAccessError;
}

const MSG_EMAIL =
  'O membro precisa ter e-mail cadastrado. Use o mesmo e-mail ao criar o usuário em Novo Usuário.';

const MSG_NO_USER =
  'Cadastre antes um usuário (Novo Usuário) com o mesmo e-mail deste membro, com senha, perfil e acesso ao ministério correspondente.';

const MSG_ROLE =
  'O usuário com este e-mail precisa ter perfil Administrador ou Colaborador com permissão para ministérios.';

function msgMinistry(displayName: string): string {
  return `Inclua o usuário em Usuários e associe o ministério "${displayName}" ao perfil dele (Assinale a permissão adequada).`;
}

/**
 * @param ministryName — valor `ministries.name` (ex.: diaconia, evangelismo, pequenas_familias).
 */
export async function assertMemberHasPortalUserForMinistry(
  memberId: number,
  ministryName: string
): Promise<void> {
  const [memberRows] = await pool.execute<any[]>(
    'SELECT id, email FROM members WHERE id = ?',
    [memberId]
  );

  if (memberRows.length === 0) {
    throw new Error('Member not found');
  }

  const email = (memberRows[0].email as string | null)?.trim();
  if (!email) {
    throw new LeaderPortalAccessError(MSG_EMAIL);
  }

  const [userRows] = await pool.execute<any[]>(
    `SELECT u.id, r.name AS role_name, r.is_super_admin AS is_super_admin
     FROM users u
     INNER JOIN roles r ON u.role_id = r.id
     WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(?))`,
    [email]
  );

  if (userRows.length === 0) {
    throw new LeaderPortalAccessError(MSG_NO_USER);
  }

  const user = userRows[0];
  if (Boolean(user.is_super_admin)) {
    return;
  }

  const roleName = String(user.role_name);
  if (!hasPermission(roleName, 'ministerios')) {
    throw new LeaderPortalAccessError(MSG_ROLE);
  }

  const [ministryRows] = await pool.execute<any[]>(
    `SELECT id, display_name FROM ministries WHERE name = ? AND is_active = 1`,
    [ministryName]
  );

  if (ministryRows.length === 0) {
    throw new LeaderPortalAccessError('Ministério inválido ou inativo.');
  }

  const displayName = (ministryRows[0].display_name as string) || ministryName;
  const ministryId = ministryRows[0].id as number;

  const [umRows] = await pool.execute<any[]>(
    'SELECT 1 FROM user_ministries WHERE user_id = ? AND ministry_id = ? LIMIT 1',
    [user.id, ministryId]
  );

  if (umRows.length === 0) {
    throw new LeaderPortalAccessError(msgMinistry(displayName));
  }
}
