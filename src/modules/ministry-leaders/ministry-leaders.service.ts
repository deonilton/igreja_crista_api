import pool from '../../shared/database/connection';
import { assertMemberHasPortalUserForMinistry } from '../../shared/validators/leaderPortalUserGate';
import {
  MinistryLeader,
  Ministry,
  MinistryWithLeaders,
  CreateMinistryLeaderRequest,
  UpdateMinistryLeaderRequest,
  MemberSearchResult,
  LeaderRole,
} from './ministry-leaders.types';

/** ministry_leaders.role às vezes vem NULL (dados antigos); UI espera leader | co_leader */
function normalizeLeaderRole(role: unknown): LeaderRole {
  if (role == null || String(role).trim() === '') return 'leader';
  const r = String(role).trim().toLowerCase().replace(/-/g, '_');
  if (r === 'co_leader' || r === 'coleader') return 'co_leader';
  return 'leader';
}

/**
 * Evita coluna duplicada `member_id` no driver (ml vs m), que podia zerar o vínculo com o membro.
 * ml.ministry_id é o slug (ex.: evangelismo), não o id numérico de ministries.
 */
function mapJoinedMlRowToLeader(row: Record<string, any>): MinistryLeader {
  const mlMemberId = row.ml_member_id != null ? Number(row.ml_member_id) : null;
  const mId = row.m_id != null ? Number(row.m_id) : null;
  const memberId = mlMemberId ?? mId ?? 0;
  return {
    id: Number(row.id),
    ministry_id: String(row.ministry_id ?? row.ml_ministry_slug ?? ''),
    member_id: memberId,
    role: normalizeLeaderRole(row.role),
    created_at: row.created_at,
    updated_at: row.updated_at,
    member:
      mId != null
        ? {
            id: mId,
            full_name: row.full_name ?? '',
            email: row.email ?? undefined,
            phone: row.phone ?? undefined,
          }
        : mlMemberId != null
          ? {
              id: mlMemberId,
              full_name: row.full_name ?? '',
              email: row.email ?? undefined,
              phone: row.phone ?? undefined,
            }
          : undefined,
  };
}

const EVANGELISMO_MINISTRY_SLUG = 'evangelismo';

/**
 * Evangelismo usa também `evangelismo_leaders`; entradas só nessa tabela contam como "líder"
 * no limite de 2 (co-líder só existe em ministry_leaders).
 */
async function assertEvangelismoCombinedLimitsOnAdd(
  connection: any,
  memberId: number,
  role: LeaderRole
): Promise<void> {
  const [mlRows] = await connection.execute(
    'SELECT member_id, role FROM ministry_leaders WHERE ministry_id = ?',
    [EVANGELISMO_MINISTRY_SLUG]
  );
  const [elRows] = await connection.execute('SELECT member_id FROM evangelismo_leaders');

  const ml = mlRows as { member_id: number; role: string }[];
  const el = elRows as { member_id: number }[];

  const mlMemberIds = new Set(ml.map((r) => Number(r.member_id)));
  const elMemberIds = new Set(el.map((r) => Number(r.member_id)));

  const mlAfterLeaderCount =
    ml.filter((r) => normalizeLeaderRole(r.role) === 'leader').length +
    (role === 'leader' ? 1 : 0);
  const mlAfterCoCount =
    ml.filter((r) => normalizeLeaderRole(r.role) === 'co_leader').length +
    (role === 'co_leader' ? 1 : 0);

  const mlAfterMemberIds = new Set(mlMemberIds);
  mlAfterMemberIds.add(memberId);

  const elOnlyAfter = [...elMemberIds].filter((id) => !mlAfterMemberIds.has(id));
  const leaderEffectiveAfter = mlAfterLeaderCount + elOnlyAfter.length;

  const unionSize = new Set([...mlAfterMemberIds, ...elMemberIds]).size;

  if (unionSize > 4) {
    throw new Error(
      'Este ministério já atingiu o máximo de 4 pessoas na liderança (2 líderes e 2 co-líderes).'
    );
  }
  if (mlAfterCoCount > 2) {
    throw new Error('Este ministério já possui o máximo de 2 co-líderes.');
  }
  if (leaderEffectiveAfter > 2) {
    throw new Error('Este ministério já possui o máximo de 2 líderes.');
  }
}

async function assertEvangelismoCombinedLimitsOnUpdate(
  connection: any,
  excludeLeaderId: number,
  newMemberId: number,
  newRole: LeaderRole
): Promise<void> {
  const [mlRows] = await connection.execute(
    'SELECT id, member_id, role FROM ministry_leaders WHERE ministry_id = ? AND id != ?',
    [EVANGELISMO_MINISTRY_SLUG, excludeLeaderId]
  );
  const [elRows] = await connection.execute('SELECT member_id FROM evangelismo_leaders');

  const ml = (mlRows as { id: number; member_id: number; role: string }[]).map((r) => ({
    member_id: Number(r.member_id),
    role: normalizeLeaderRole(r.role),
  }));
  const elMemberIds = new Set((elRows as { member_id: number }[]).map((r) => Number(r.member_id)));

  const mlAfter = [...ml, { member_id: newMemberId, role: newRole }];

  const mlAfterLeaderCount = mlAfter.filter((r) => r.role === 'leader').length;
  const mlAfterCoCount = mlAfter.filter((r) => r.role === 'co_leader').length;
  const mlAfterMemberIds = new Set(mlAfter.map((r) => r.member_id));

  const elOnlyAfter = [...elMemberIds].filter((id) => !mlAfterMemberIds.has(id));
  const leaderEffectiveAfter = mlAfterLeaderCount + elOnlyAfter.length;
  const unionSize = new Set([...mlAfterMemberIds, ...elMemberIds]).size;

  if (unionSize > 4) {
    throw new Error(
      'Este ministério já atingiu o máximo de 4 pessoas na liderança (2 líderes e 2 co-líderes).'
    );
  }
  if (mlAfterCoCount > 2) {
    throw new Error('Este ministério já possui o máximo de 2 co-líderes.');
  }
  if (leaderEffectiveAfter > 2) {
    throw new Error('Este ministério já possui o máximo de 2 líderes.');
  }
}

function appendEvangelismoTableLeaders(
  leaders: MinistryLeader[],
  evangelismoRows: Record<string, any>[]
): MinistryLeader[] {
  if (!evangelismoRows.length) return leaders;
  const seen = new Set(leaders.map((l) => l.member_id));
  const out = [...leaders];
  for (const r of evangelismoRows) {
    const mid = Number(r.member_id);
    if (Number.isNaN(mid) || seen.has(mid)) continue;
    out.push({
      id: -Number(r.id),
      ministry_id: EVANGELISMO_MINISTRY_SLUG,
      member_id: mid,
      role: 'leader',
      created_at: r.created_at,
      updated_at: r.updated_at,
      member: {
        id: Number(r.m_id),
        full_name: r.full_name ?? '',
        email: r.email ?? undefined,
        phone: r.phone ?? undefined,
      },
    });
    seen.add(mid);
  }
  return out;
}

export class MinistryLeadersService {
  // Get all ministries with their leaders
  async getMinistriesWithLeaders(): Promise<MinistryWithLeaders[]> {
    try {
      const connection = await pool.getConnection();
      
      // First, get all active ministries
      const [ministriesRows] = await connection.execute(
        `SELECT name as id, name, display_name, description, icon, is_active 
         FROM ministries 
         WHERE is_active = true 
         ORDER BY display_name`
      );

      const ministries = ministriesRows as Ministry[];

      // Then, get all leaders with member information
      const [leadersRows] = await connection.execute(
        `SELECT ml.id, ml.ministry_id, ml.member_id AS ml_member_id, ml.role, ml.created_at, ml.updated_at,
                m.id AS m_id, m.full_name, m.email, m.phone
         FROM ministry_leaders ml
         LEFT JOIN members m ON ml.member_id = m.id
         LEFT JOIN ministries min ON ml.ministry_id = min.name COLLATE utf8mb4_unicode_ci
         ORDER BY ml.ministry_id, ml.role, ml.created_at`
      );

      const leaders = leadersRows as any[];

      const [evangelismoLeaderRows] = await connection.execute(
        `SELECT el.id, el.member_id, el.created_at, el.updated_at,
                m.id AS m_id, m.full_name, m.email, m.phone
         FROM evangelismo_leaders el
         INNER JOIN members m ON el.member_id = m.id`
      );

      // Group leaders by ministry
      const ministriesWithLeaders: MinistryWithLeaders[] = ministries.map((ministry) => {
        let ministryLeaders = leaders
          .filter((leader) => leader.ministry_id === ministry.name)
          .map((row) => mapJoinedMlRowToLeader(row));

        if (ministry.name === EVANGELISMO_MINISTRY_SLUG) {
          ministryLeaders = appendEvangelismoTableLeaders(
            ministryLeaders,
            evangelismoLeaderRows as Record<string, any>[]
          );
        }

        return {
          ...ministry,
          leaders: ministryLeaders,
        };
      });

      connection.release();
      return ministriesWithLeaders;
    } catch (error) {
      console.error('Error getting ministries with leaders:', error);
      throw new Error('Failed to get ministries with leaders');
    }
  }

  // Get leaders of a specific ministry
  async getMinistryLeaders(ministryId: string): Promise<MinistryLeader[]> {
    try {
      const connection = await pool.getConnection();
      
      const [rows] = await connection.execute(
        `SELECT ml.id, ml.ministry_id, ml.member_id AS ml_member_id, ml.role, ml.created_at, ml.updated_at,
                m.id AS m_id, m.full_name, m.email, m.phone
         FROM ministry_leaders ml
         LEFT JOIN members m ON ml.member_id = m.id
         WHERE ml.ministry_id = ?
         ORDER BY ml.role, ml.created_at`,
        [ministryId]
      );

      let leaders = (rows as any[]).map((row) => mapJoinedMlRowToLeader(row));

      if (ministryId === EVANGELISMO_MINISTRY_SLUG) {
        const [evangelismoLeaderRows] = await connection.execute(
          `SELECT el.id, el.member_id, el.created_at, el.updated_at,
                  m.id AS m_id, m.full_name, m.email, m.phone
           FROM evangelismo_leaders el
           INNER JOIN members m ON el.member_id = m.id`
        );
        leaders = appendEvangelismoTableLeaders(leaders, evangelismoLeaderRows as Record<string, any>[]);
      }

      connection.release();
      return leaders;
    } catch (error) {
      console.error('Error getting ministry leaders:', error);
      throw new Error('Failed to get ministry leaders');
    }
  }

  // Add leader to ministry
  async addLeader(data: CreateMinistryLeaderRequest): Promise<MinistryLeader> {
    try {
      await assertMemberHasPortalUserForMinistry(data.member_id, data.ministry_id);

      const connection = await pool.getConnection();

      // Check if member exists
      const [memberRows] = await connection.execute(
        'SELECT id, full_name, email, phone FROM members WHERE id = ?',
        [data.member_id]
      );

      if ((memberRows as any[]).length === 0) {
        connection.release();
        throw new Error('Member not found');
      }

      // Check if ministry exists and is active
      const [ministryRows] = await connection.execute(
        'SELECT id, name, display_name FROM ministries WHERE name = ? AND is_active = true',
        [data.ministry_id]
      );

      if ((ministryRows as any[]).length === 0) {
        connection.release();
        throw new Error('Ministry not found or inactive');
      }

      // Check if member is already a leader of this ministry
      const [existingRows] = await connection.execute(
        'SELECT id FROM ministry_leaders WHERE ministry_id = ? AND member_id = ?',
        [data.ministry_id, data.member_id]
      );

      if ((existingRows as any[]).length > 0) {
        connection.release();
        throw new Error('Member is already a leader of this ministry');
      }

      if (data.ministry_id === EVANGELISMO_MINISTRY_SLUG) {
        await assertEvangelismoCombinedLimitsOnAdd(connection, data.member_id, data.role);
      } else {
        // Check if this specific role already has 2 leaders (couple)
        const [roleCountRows] = await connection.execute(
          'SELECT COUNT(*) as count FROM ministry_leaders WHERE ministry_id = ? AND role = ?',
          [data.ministry_id, data.role]
        );

        const roleCount = (roleCountRows as any[])[0].count;
        if (roleCount >= 2) {
          connection.release();
          throw new Error(
            `Ministry already has the maximum of 2 ${data.role === 'leader' ? 'leaders' : 'co-leaders'} (couple)`
          );
        }

        // Check if ministry already has 4 leaders total (2 leaders + 2 co-leaders)
        const [totalCountRows] = await connection.execute(
          'SELECT COUNT(*) as count FROM ministry_leaders WHERE ministry_id = ?',
          [data.ministry_id]
        );

        const totalCount = (totalCountRows as any[])[0].count;
        if (totalCount >= 4) {
          connection.release();
          throw new Error('Ministry already has maximum of 4 leaders (2 leaders + 2 co-leaders)');
        }
      }

      // Insert the new leader
      const [result] = await connection.execute(
        'INSERT INTO ministry_leaders (ministry_id, member_id, role) VALUES (?, ?, ?)',
        [data.ministry_id, data.member_id, data.role]
      );

      const insertId = (result as any).insertId;

      if (data.ministry_id === EVANGELISMO_MINISTRY_SLUG) {
        await connection.execute('DELETE FROM evangelismo_leaders WHERE member_id = ?', [
          data.member_id,
        ]);
      }

      // Get the created leader with member information
      const [newLeaderRows] = await connection.execute(
        `SELECT ml.id, ml.ministry_id AS ml_ministry_slug, ml.member_id AS ml_member_id, ml.role, ml.created_at, ml.updated_at,
                m.id AS m_id, m.full_name, m.email, m.phone,
                min.id AS ministry_pk, min.name AS ministry_name, min.display_name AS ministry_display_name
         FROM ministry_leaders ml
         LEFT JOIN members m ON ml.member_id = m.id
         LEFT JOIN ministries min ON ml.ministry_id = min.name COLLATE utf8mb4_unicode_ci
         WHERE ml.id = ?`,
        [insertId]
      );

      const newLeader = (newLeaderRows as any[])[0];
      const base = mapJoinedMlRowToLeader({
        ...newLeader,
        ministry_id: newLeader.ml_ministry_slug,
      });

      const leader: MinistryLeader = {
        ...base,
        ministry: newLeader.ministry_pk
          ? {
              id: newLeader.ministry_name,
              name: newLeader.ministry_name,
              display_name: newLeader.ministry_display_name,
            }
          : undefined,
      };

      connection.release();
      return leader;
    } catch (error) {
      console.error('Error adding leader:', error);
      throw error;
    }
  }

  // Update leader
  async updateLeader(leaderId: number, data: UpdateMinistryLeaderRequest): Promise<MinistryLeader> {
    try {
      const [preRows] = await pool.execute<any[]>(
        'SELECT ministry_id FROM ministry_leaders WHERE id = ?',
        [leaderId]
      );
      if (preRows.length === 0) {
        throw new Error('Leader not found');
      }
      await assertMemberHasPortalUserForMinistry(data.member_id, preRows[0].ministry_id);

      const connection = await pool.getConnection();

      // Check if leader exists
      const [existingLeaderRows] = await connection.execute(
        'SELECT id, ministry_id, member_id, role FROM ministry_leaders WHERE id = ?',
        [leaderId]
      );

      if ((existingLeaderRows as any[]).length === 0) {
        connection.release();
        throw new Error('Leader not found');
      }

      const existingLeader = (existingLeaderRows as any[])[0];
      const effectiveRole: LeaderRole = data.role
        ? data.role
        : normalizeLeaderRole(existingLeader.role);

      // Check if new member exists
      const [memberRows] = await connection.execute(
        'SELECT id, full_name, email, phone FROM members WHERE id = ?',
        [data.member_id]
      );

      if ((memberRows as any[]).length === 0) {
        connection.release();
        throw new Error('Member not found');
      }

      // Check if new member is already a leader of this ministry (excluding current leader)
      const [duplicateRows] = await connection.execute(
        'SELECT id FROM ministry_leaders WHERE ministry_id = ? AND member_id = ? AND id != ?',
        [existingLeader.ministry_id, data.member_id, leaderId]
      );

      if ((duplicateRows as any[]).length > 0) {
        connection.release();
        throw new Error('Member is already a leader of this ministry');
      }

      if (existingLeader.ministry_id === EVANGELISMO_MINISTRY_SLUG) {
        await assertEvangelismoCombinedLimitsOnUpdate(
          connection,
          leaderId,
          data.member_id,
          effectiveRole
        );
      } else if (data.role) {
        const [roleCheckRows] = await connection.execute(
          'SELECT COUNT(*) as count FROM ministry_leaders WHERE ministry_id = ? AND role = ? AND id != ?',
          [existingLeader.ministry_id, data.role, leaderId]
        );

        const roleCount = (roleCheckRows as any[])[0].count;
        if (roleCount >= 2) {
          connection.release();
          throw new Error(
            `This ministry already has the maximum of 2 ${data.role === 'leader' ? 'leaders' : 'co-leaders'}`
          );
        }
      }

      // Update the leader
      const updates: string[] = ['member_id = ?', 'updated_at = CURRENT_TIMESTAMP'];
      const params: any[] = [data.member_id, leaderId];

      if (data.role) {
        updates.push('role = ?');
        params.unshift(data.role);
      }

      await connection.execute(
        `UPDATE ministry_leaders SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      if (existingLeader.ministry_id === EVANGELISMO_MINISTRY_SLUG) {
        await connection.execute('DELETE FROM evangelismo_leaders WHERE member_id = ?', [
          data.member_id,
        ]);
      }

      // Get the updated leader with member information
      const [updatedLeaderRows] = await connection.execute(
        `SELECT ml.id, ml.ministry_id AS ml_ministry_slug, ml.member_id AS ml_member_id, ml.role, ml.created_at, ml.updated_at,
                m.id AS m_id, m.full_name, m.email, m.phone,
                min.id AS ministry_pk, min.name AS ministry_name, min.display_name AS ministry_display_name
         FROM ministry_leaders ml
         LEFT JOIN members m ON ml.member_id = m.id
         LEFT JOIN ministries min ON ml.ministry_id = min.name COLLATE utf8mb4_unicode_ci
         WHERE ml.id = ?`,
        [leaderId]
      );

      const updatedLeader = (updatedLeaderRows as any[])[0];
      const base = mapJoinedMlRowToLeader({
        ...updatedLeader,
        ministry_id: updatedLeader.ml_ministry_slug,
      });

      const leader: MinistryLeader = {
        ...base,
        ministry: updatedLeader.ministry_pk
          ? {
              id: updatedLeader.ministry_name,
              name: updatedLeader.ministry_name,
              display_name: updatedLeader.ministry_display_name,
            }
          : undefined,
      };

      connection.release();
      return leader;
    } catch (error) {
      console.error('Error updating leader:', error);
      throw error;
    }
  }

  // Remove leader
  async removeLeader(leaderId: number): Promise<void> {
    const connection = await pool.getConnection();
    try {
      if (leaderId < 0) {
        const [delResult] = await connection.execute(
          'DELETE FROM evangelismo_leaders WHERE id = ?',
          [-leaderId]
        );
        const affected = (delResult as any).affectedRows ?? 0;
        if (affected === 0) {
          throw new Error('Leader not found');
        }
        return;
      }

      const [existingRows] = await connection.execute(
        'SELECT id, ministry_id, member_id FROM ministry_leaders WHERE id = ?',
        [leaderId]
      );

      if ((existingRows as any[]).length === 0) {
        throw new Error('Leader not found');
      }

      const row = (existingRows as any[])[0];

      await connection.execute('DELETE FROM ministry_leaders WHERE id = ?', [leaderId]);

      if (row.ministry_id === EVANGELISMO_MINISTRY_SLUG) {
        await connection.execute('DELETE FROM evangelismo_leaders WHERE member_id = ?', [
          row.member_id,
        ]);
      }
    } catch (error) {
      console.error('Error removing leader:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Search members for autocomplete
  async searchMembers(query: string): Promise<MemberSearchResult[]> {
    try {
      const connection = await pool.getConnection();
      
      const [rows] = await connection.execute(
        `SELECT id, full_name, email, phone 
         FROM members 
         WHERE full_name LIKE ? OR email LIKE ?
         ORDER BY full_name
         LIMIT 10`,
        [`%${query}%`, `%${query}%`]
      );

      const members = (rows as any[]).map(member => ({
        id: member.id,
        full_name: member.full_name,
        email: member.email,
        phone: member.phone
      }));

      connection.release();
      return members;
    } catch (error) {
      console.error('Error searching members:', error);
      throw new Error('Failed to search members');
    }
  }

  // Get member leaderships
  async getMemberLeaderships(memberId: number): Promise<MinistryLeader[]> {
    try {
      const connection = await pool.getConnection();
      
      const [rows] = await connection.execute(
        `SELECT ml.id, ml.ministry_id AS ml_ministry_slug, ml.member_id AS ml_member_id, ml.role, ml.created_at, ml.updated_at,
                min.id AS ministry_pk, min.name AS ministry_name, min.display_name AS ministry_display_name
         FROM ministry_leaders ml
         LEFT JOIN ministries min ON ml.ministry_id = min.name COLLATE utf8mb4_unicode_ci
         WHERE ml.member_id = ?
         ORDER BY ml.role, ml.created_at`,
        [memberId]
      );

      const leaderships = (rows as any[]).map((row) => ({
        id: Number(row.id),
        ministry_id: String(row.ml_ministry_slug ?? ''),
        member_id: Number(row.ml_member_id),
        role: normalizeLeaderRole(row.role),
        created_at: row.created_at,
        updated_at: row.updated_at,
        ministry: row.ministry_pk
          ? {
              id: row.ministry_name,
              name: row.ministry_name,
              display_name: row.ministry_display_name,
            }
          : undefined,
      }));

      connection.release();
      return leaderships;
    } catch (error) {
      console.error('Error getting member memberships:', error);
      throw new Error('Failed to get member memberships');
    }
  }
}

export const ministryLeadersService = new MinistryLeadersService();
