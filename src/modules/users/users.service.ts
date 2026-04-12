// Users Service - Regras de negócio de usuários
import bcrypt from 'bcryptjs';
import type { PoolConnection } from 'mysql2/promise';
import pool from '../../shared/database/connection';
import { ministryLeadersService } from '../ministry-leaders/ministry-leaders.service';
import { User, CreateUserRequest, UpdateUserRequest } from './users.types';

/** Compara nome completo ignorando acentos e caixa (fallback quando e-mail membro ≠ usuário). */
function normalizeForPersonMatch(value: string | null | undefined): string {
  if (value == null || String(value).trim() === '') return '';
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/** Ministérios que exibem o card de líderes no painel (mesmo conjunto usado no front). */
const MINISTRIES_WITH_LEADERSHIP_CARD = new Set([
  'pequenas_familias',
  'evangelismo',
  'diaconia',
  'louvor',
  'ministerio_infantil',
  'membros',
]);

async function resolveMemberIdFromUserProfile(
  executor: PoolConnection | typeof pool,
  email: string | null | undefined,
  name: string | null | undefined
): Promise<number | null> {
  const emailNorm =
    email && String(email).trim() !== '' ? String(email).trim().toLowerCase() : null;
  if (emailNorm) {
    const [rows] = await executor.execute<any[]>(
      'SELECT id FROM members WHERE email IS NOT NULL AND LOWER(TRIM(email)) = ? LIMIT 1',
      [emailNorm]
    );
    if (rows.length > 0) return rows[0].id;
  }
  const userNameNorm = normalizeForPersonMatch(name);
  if (userNameNorm === '') return null;
  const [members] = await executor.execute<any[]>(
    'SELECT id, full_name FROM members WHERE full_name IS NOT NULL'
  );
  const matches = (members as { id: number; full_name: string }[]).filter(
    (m) => normalizeForPersonMatch(m.full_name) === userNameNorm
  );
  if (matches.length === 1) return matches[0].id;
  return null;
}

/**
 * Alinha `ministry_leaders` com o acesso do painel: quem tem ministério em `user_ministries`
 * e membro correspondente aparece como líder no card do ministério (como em /pequenas-familias).
 */
async function syncMinistryLeadersWithUserAccess(
  params: {
    email: string;
    name: string;
    role: string;
    ministrySlugs: string[];
  },
  mode: 'create' | 'update'
): Promise<void> {
  if (params.role === 'super_admin') {
    if (mode === 'update') {
      const memberId = await resolveMemberIdFromUserProfile(pool, params.email, params.name);
      if (memberId != null) {
        await pool.execute('DELETE FROM ministry_leaders WHERE member_id = ?', [memberId]);
      }
    }
    return;
  }

  const slugs = [...new Set(params.ministrySlugs)].filter((s) =>
    MINISTRIES_WITH_LEADERSHIP_CARD.has(s)
  );

  const memberId = await resolveMemberIdFromUserProfile(pool, params.email, params.name);
  if (memberId == null) return;

  if (mode === 'update') {
    if (slugs.length === 0) {
      await pool.execute('DELETE FROM ministry_leaders WHERE member_id = ?', [memberId]);
    } else {
      const placeholders = slugs.map(() => '?').join(',');
      await pool.execute(
        `DELETE FROM ministry_leaders WHERE member_id = ? AND ministry_id NOT IN (${placeholders})`,
        [memberId, ...slugs]
      );
    }
  }

  if (slugs.length === 0) return;

  for (const slug of slugs) {
    const [existing] = await pool.execute<any[]>(
      'SELECT id FROM ministry_leaders WHERE member_id = ? AND ministry_id = ? LIMIT 1',
      [memberId, slug]
    );
    if (existing.length > 0) continue;

    try {
      await ministryLeadersService.addLeader({
        ministry_id: slug,
        member_id: memberId,
        role: 'leader',
      });
    } catch (e) {
      console.warn(`[users] Não foi possível sincronizar líder do ministério "${slug}":`, e);
    }
  }
}

class UsersService {
  async findAll(): Promise<User[]> {
    const [rows] = await pool.execute<any[]>(
      `SELECT 
        u.id, u.name, u.email, u.role_id, u.created_at,
        r.name as role, r.is_super_admin
       FROM users u
       INNER JOIN roles r ON u.role_id = r.id
       ORDER BY u.created_at DESC`
    );

    const usersWithMinistries = await Promise.all(
      rows.map(async (user) => {
        let ministries: string[] = [];
        
        if (!user.is_super_admin) {
          const [ministryRows] = await pool.execute<any[]>(
            `SELECT m.name 
             FROM user_ministries um
             INNER JOIN ministries m ON um.ministry_id = m.id
             WHERE um.user_id = ? AND m.is_active = 1`,
            [user.id]
          );
          ministries = ministryRows.map((row: any) => row.name);
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          ministries,
          created_at: user.created_at
        };
      })
    );

    return usersWithMinistries;
  }

  async create(data: CreateUserRequest): Promise<number> {
    // Verificar email duplicado
    const [existing] = await pool.execute<any[]>(
      'SELECT id FROM users WHERE email = ?',
      [data.email]
    );

    if (existing.length > 0) {
      throw new Error('Este email já está cadastrado.');
    }

    // Buscar role_id
    const [roleRows] = await pool.execute<any[]>(
      'SELECT id FROM roles WHERE name = ?',
      [data.role || 'colaborador']
    );

    if (roleRows.length === 0) {
      throw new Error('Role inválida.');
    }

    const roleId = roleRows[0].id;
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const [result] = await pool.execute<any>(
      'INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)',
      [data.name, data.email, hashedPassword, roleId]
    );

    const userId = result.insertId;

    // Inserir ministérios
    if (data.ministries && data.ministries.length > 0) {
      for (const ministryName of data.ministries) {
        const [ministryRows] = await pool.execute<any[]>(
          'SELECT id FROM ministries WHERE name = ?',
          [ministryName]
        );
        
        if (ministryRows.length > 0) {
          await pool.execute(
            'INSERT INTO user_ministries (user_id, ministry_id) VALUES (?, ?)',
            [userId, ministryRows[0].id]
          );
        }
      }
    }

    await syncMinistryLeadersWithUserAccess(
      {
        email: data.email,
        name: data.name,
        role: data.role || 'colaborador',
        ministrySlugs: data.ministries ?? [],
      },
      'create'
    );

    return userId;
  }

  async update(id: number, data: UpdateUserRequest): Promise<void> {
    // Verificar se usuário existe
    const [existing] = await pool.execute<any[]>(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      throw new Error('Usuário não encontrado.');
    }

    // Verificar email duplicado
    const [emailCheck] = await pool.execute<any[]>(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [data.email, id]
    );

    if (emailCheck.length > 0) {
      throw new Error('Este email já está em uso.');
    }

    // Buscar role_id
    const [roleRows] = await pool.execute<any[]>(
      'SELECT id FROM roles WHERE name = ?',
      [data.role || 'colaborador']
    );

    if (roleRows.length === 0) {
      throw new Error('Role inválida.');
    }

    const roleId = roleRows[0].id;

    // Atualizar usuário
    if (data.password && data.password.length >= 6) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      await pool.execute(
        'UPDATE users SET name = ?, email = ?, password = ?, role_id = ? WHERE id = ?',
        [data.name, data.email, hashedPassword, roleId, id]
      );
    } else {
      await pool.execute(
        'UPDATE users SET name = ?, email = ?, role_id = ? WHERE id = ?',
        [data.name, data.email, roleId, id]
      );
    }

    // Atualizar ministérios
    await pool.execute('DELETE FROM user_ministries WHERE user_id = ?', [id]);

    if (data.ministries && data.ministries.length > 0) {
      for (const ministryName of data.ministries) {
        const [ministryRows] = await pool.execute<any[]>(
          'SELECT id FROM ministries WHERE name = ?',
          [ministryName]
        );
        
        if (ministryRows.length > 0) {
          await pool.execute(
            'INSERT INTO user_ministries (user_id, ministry_id) VALUES (?, ?)',
            [id, ministryRows[0].id]
          );
        }
      }
    }

    await syncMinistryLeadersWithUserAccess(
      {
        email: data.email,
        name: data.name,
        role: data.role || 'colaborador',
        ministrySlugs: data.ministries ?? [],
      },
      'update'
    );
  }

  async delete(id: number, currentUserId: number): Promise<void> {
    if (id === currentUserId) {
      throw new Error('Não é possível excluir o próprio usuário.');
    }

    const [existing] = await pool.execute<any[]>(
      'SELECT id, email, name FROM users WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      throw new Error('Usuário não encontrado.');
    }

    const row = existing[0];
    const emailRaw = row.email as string | null | undefined;
    const emailNorm =
      emailRaw && String(emailRaw).trim() !== ''
        ? String(emailRaw).trim().toLowerCase()
        : null;
    const userNameNorm = normalizeForPersonMatch(row.name as string | null | undefined);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      let memberIdToClean: number | null = null;

      if (emailNorm) {
        const [memberRows] = await connection.execute<any[]>(
          'SELECT id FROM members WHERE email IS NOT NULL AND LOWER(TRIM(email)) = ? LIMIT 1',
          [emailNorm]
        );
        if (memberRows.length > 0) {
          memberIdToClean = memberRows[0].id;
        }
      }

      if (memberIdToClean == null && userNameNorm !== '') {
        const [leaderMembers] = await connection.execute<any[]>(
          `SELECT DISTINCT m.id, m.full_name
           FROM members m
           WHERE m.id IN (
             SELECT member_id FROM ministry_leaders
             UNION
             SELECT member_id FROM evangelismo_leaders
           )`
        );
        const nameMatches = leaderMembers.filter(
          (m) => normalizeForPersonMatch(m.full_name) === userNameNorm
        );
        if (nameMatches.length === 1) {
          memberIdToClean = nameMatches[0].id;
        }
      }

      if (memberIdToClean != null) {
        await connection.execute('DELETE FROM ministry_leaders WHERE member_id = ?', [
          memberIdToClean,
        ]);
        await connection.execute('DELETE FROM evangelismo_leaders WHERE member_id = ?', [
          memberIdToClean,
        ]);
      }

      await connection.execute('DELETE FROM users WHERE id = ?', [id]);
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}

export default new UsersService();
