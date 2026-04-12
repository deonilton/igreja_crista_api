// Deacons Service
import pool from '../../shared/database/connection';
import { assertMemberHasPortalUserForMinistry } from '../../shared/validators/leaderPortalUserGate';
import { Deacon, CreateDeaconRequest, UpdateDeaconRequest, MemberSearchResult } from './deacons.types';

function sanitizePagination(page: number, limit: number): { safePage: number; safeLimit: number; safeOffset: number } {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 10;
  return {
    safePage,
    safeLimit,
    safeOffset: (safePage - 1) * safeLimit,
  };
}

class DeaconsService {
  async findAll(page: number = 1, limit: number = 10): Promise<{ deacons: Deacon[], total: number, page: number, totalPages: number }> {
    const { safePage, safeLimit, safeOffset } = sanitizePagination(page, limit);
    
    // Query para contar total de registros
    const [countResult] = await pool.execute<any[]>(
      'SELECT COUNT(*) as total FROM deacons'
    );
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / safeLimit);
    
    // Query para buscar diáconos com dados dos membros
    const [rows] = await pool.execute<any[]>(
      `SELECT 
        d.id,
        d.member_id,
        d.created_at,
        d.updated_at,
        m.id as member_id,
        m.full_name,
        m.email,
        m.phone
       FROM deacons d
       INNER JOIN members m ON d.member_id = m.id
       ORDER BY d.created_at DESC
       LIMIT ${safeLimit} OFFSET ${safeOffset}`
    );
    
    // Formatar resultado
    const deacons: Deacon[] = rows.map(row => ({
      id: row.id,
      member_id: row.member_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      member: {
        id: row.member_id,
        full_name: row.full_name,
        email: row.email,
        phone: row.phone
      }
    }));
    
    return {
      deacons,
      total,
      page: safePage,
      totalPages
    };
  }

  async findById(id: number): Promise<Deacon | null> {
    const [rows] = await pool.execute<any[]>(
      `SELECT 
        d.id,
        d.member_id,
        d.created_at,
        d.updated_at,
        m.id as member_id,
        m.full_name,
        m.email,
        m.phone
       FROM deacons d
       INNER JOIN members m ON d.member_id = m.id
       WHERE d.id = ?`,
      [id]
    );
    
    if (rows.length === 0) return null;
    
    const row = rows[0];
    return {
      id: row.id,
      member_id: row.member_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      member: {
        id: row.member_id,
        full_name: row.full_name,
        email: row.email,
        phone: row.phone
      }
    };
  }

  async create(data: CreateDeaconRequest): Promise<number> {
    // Verificar se o membro existe
    const [memberExists] = await pool.execute<any[]>(
      'SELECT id FROM members WHERE id = ?',
      [data.member_id]
    );
    
    if (memberExists.length === 0) {
      throw new Error('Membro não encontrado');
    }

    await assertMemberHasPortalUserForMinistry(data.member_id, 'diaconia');
    
    // Verificar se o membro já é diácono
    const [alreadyDeacon] = await pool.execute<any[]>(
      'SELECT id FROM deacons WHERE member_id = ?',
      [data.member_id]
    );
    
    if (alreadyDeacon.length > 0) {
      throw new Error('Este membro já é um diácono');
    }
    
    const [result] = await pool.execute<any>(
      'INSERT INTO deacons (member_id) VALUES (?)',
      [data.member_id]
    );
    return result.insertId;
  }

  async update(id: number, data: UpdateDeaconRequest): Promise<void> {
    // Verificar se o diácono existe
    const [deaconExists] = await pool.execute<any[]>(
      'SELECT id FROM deacons WHERE id = ?',
      [id]
    );
    
    if (deaconExists.length === 0) {
      throw new Error('Diácono não encontrado');
    }
    
    // Verificar se o membro existe
    const [memberExists] = await pool.execute<any[]>(
      'SELECT id FROM members WHERE id = ?',
      [data.member_id]
    );
    
    if (memberExists.length === 0) {
      throw new Error('Membro não encontrado');
    }

    await assertMemberHasPortalUserForMinistry(data.member_id, 'diaconia');
    
    // Verificar se o membro já é diácono (exceto o próprio)
    const [alreadyDeacon] = await pool.execute<any[]>(
      'SELECT id FROM deacons WHERE member_id = ? AND id != ?',
      [data.member_id, id]
    );
    
    if (alreadyDeacon.length > 0) {
      throw new Error('Este membro já é um diácono');
    }
    
    await pool.execute(
      'UPDATE deacons SET member_id = ? WHERE id = ?',
      [data.member_id, id]
    );
  }

  async delete(id: number): Promise<void> {
    // Verificar se o diácono existe
    const [deaconExists] = await pool.execute<any[]>(
      'SELECT id FROM deacons WHERE id = ?',
      [id]
    );
    
    if (deaconExists.length === 0) {
      throw new Error('Diácono não encontrado');
    }
    
    await pool.execute('DELETE FROM deacons WHERE id = ?', [id]);
  }

  async searchMembers(query: string): Promise<MemberSearchResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }
    
    const searchParam = `%${query.trim()}%`;
    const [rows] = await pool.execute<any[]>(
      `SELECT 
        id, 
        full_name, 
        email, 
        phone
       FROM members 
       WHERE (full_name LIKE ? OR email LIKE ?)
       AND status = 'Ativo'
       ORDER BY full_name
       LIMIT 10`,
      [searchParam, searchParam]
    );
    
    return rows.map(row => ({
      id: row.id,
      full_name: row.full_name,
      email: row.email,
      phone: row.phone
    }));
  }

  async getStatistics(): Promise<{ total: number, men: number, women: number }> {
    const [rows] = await pool.execute<any[]>(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE 
          WHEN m.gender IS NULL THEN 0
          WHEN LOWER(TRIM(m.gender)) = 'masculino' OR LOWER(TRIM(m.gender)) = 'm' THEN 1 
          ELSE 0 
        END) as men,
        SUM(CASE 
          WHEN m.gender IS NULL THEN 0
          WHEN LOWER(TRIM(m.gender)) = 'feminino' OR LOWER(TRIM(m.gender)) = 'f' THEN 1 
          ELSE 0 
        END) as women
       FROM deacons d
       INNER JOIN members m ON d.member_id = m.id`
    );
    
    return {
      total: rows[0].total || 0,
      men: rows[0].men || 0,
      women: rows[0].women || 0
    };
  }

  async findByMemberId(memberId: number): Promise<Deacon | null> {
    const [rows] = await pool.execute<any[]>(
      `SELECT 
        d.id,
        d.member_id,
        d.created_at,
        d.updated_at,
        m.id as member_id,
        m.full_name,
        m.email,
        m.phone
       FROM deacons d
       INNER JOIN members m ON d.member_id = m.id
       WHERE d.member_id = ?`,
      [memberId]
    );
    
    if (rows.length === 0) return null;
    
    const row = rows[0];
    return {
      id: row.id,
      member_id: row.member_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      member: {
        id: row.member_id,
        full_name: row.full_name,
        email: row.email,
        phone: row.phone
      }
    };
  }
}

export default new DeaconsService();
