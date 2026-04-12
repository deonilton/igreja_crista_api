// Small Families Service
import pool from '../../shared/database/connection';
import { assertMemberHasPortalUserForMinistry } from '../../shared/validators/leaderPortalUserGate';
import { SmallFamily, CreateSmallFamilyRequest, UpdateSmallFamilyRequest, MemberSearchResult } from './small-families.types';

function sanitizePagination(page: number, limit: number): { safePage: number; safeLimit: number; safeOffset: number } {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 10;
  return {
    safePage,
    safeLimit,
    safeOffset: (safePage - 1) * safeLimit,
  };
}

class SmallFamiliesService {
  async findAll(page: number = 1, limit: number = 10): Promise<{ families: SmallFamily[], total: number, page: number, totalPages: number }> {
    const { safePage, safeLimit, safeOffset } = sanitizePagination(page, limit);
    
    const [countResult] = await pool.execute<any[]>(
      'SELECT COUNT(*) as total FROM small_families'
    );
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / safeLimit);
    
    const [rows] = await pool.execute<any[]>(
      `SELECT 
        sf.id,
        sf.member_id,
        sf.created_at,
        sf.updated_at,
        m.id as member_id,
        m.full_name,
        m.email,
        m.phone
       FROM small_families sf
       INNER JOIN members m ON sf.member_id = m.id
       ORDER BY sf.created_at DESC
       LIMIT ${safeLimit} OFFSET ${safeOffset}`
    );
    
    const families: SmallFamily[] = rows.map(row => ({
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
      families,
      total,
      page: safePage,
      totalPages
    };
  }

  async findById(id: number): Promise<SmallFamily | null> {
    const [rows] = await pool.execute<any[]>(
      `SELECT 
        sf.id,
        sf.member_id,
        sf.created_at,
        sf.updated_at,
        m.id as member_id,
        m.full_name,
        m.email,
        m.phone
       FROM small_families sf
       INNER JOIN members m ON sf.member_id = m.id
       WHERE sf.id = ?`,
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

  async create(data: CreateSmallFamilyRequest): Promise<number> {
    const [memberExists] = await pool.execute<any[]>(
      'SELECT id FROM members WHERE id = ?',
      [data.member_id]
    );
    
    if (memberExists.length === 0) {
      throw new Error('Membro não encontrado');
    }

    await assertMemberHasPortalUserForMinistry(data.member_id, 'pequenas_familias');
    
    const [alreadyExists] = await pool.execute<any[]>(
      'SELECT id FROM small_families WHERE member_id = ?',
      [data.member_id]
    );
    
    if (alreadyExists.length > 0) {
      throw new Error('Este membro já é um líder de pequena família');
    }
    
    const [result] = await pool.execute<any>(
      'INSERT INTO small_families (member_id) VALUES (?)',
      [data.member_id]
    );
    return result.insertId;
  }

  async update(id: number, data: UpdateSmallFamilyRequest): Promise<void> {
    const [familyExists] = await pool.execute<any[]>(
      'SELECT id FROM small_families WHERE id = ?',
      [id]
    );
    
    if (familyExists.length === 0) {
      throw new Error('Líder de pequena família não encontrado');
    }
    
    const [memberExists] = await pool.execute<any[]>(
      'SELECT id FROM members WHERE id = ?',
      [data.member_id]
    );
    
    if (memberExists.length === 0) {
      throw new Error('Membro não encontrado');
    }

    await assertMemberHasPortalUserForMinistry(data.member_id, 'pequenas_familias');
    
    const [alreadyExists] = await pool.execute<any[]>(
      'SELECT id FROM small_families WHERE member_id = ? AND id != ?',
      [data.member_id, id]
    );
    
    if (alreadyExists.length > 0) {
      throw new Error('Este membro já é um líder de pequena família');
    }
    
    await pool.execute(
      'UPDATE small_families SET member_id = ? WHERE id = ?',
      [data.member_id, id]
    );
  }

  async delete(id: number): Promise<void> {
    const [familyExists] = await pool.execute<any[]>(
      'SELECT id FROM small_families WHERE id = ?',
      [id]
    );
    
    if (familyExists.length === 0) {
      throw new Error('Líder de pequena família não encontrado');
    }
    
    await pool.execute('DELETE FROM small_families WHERE id = ?', [id]);
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
       FROM small_families sf
       INNER JOIN members m ON sf.member_id = m.id`
    );
    
    return {
      total: rows[0].total || 0,
      men: rows[0].men || 0,
      women: rows[0].women || 0
    };
  }

  async findByMemberId(memberId: number): Promise<SmallFamily | null> {
    const [rows] = await pool.execute<any[]>(
      `SELECT 
        sf.id,
        sf.member_id,
        sf.created_at,
        sf.updated_at,
        m.id as member_id,
        m.full_name,
        m.email,
        m.phone
       FROM small_families sf
       INNER JOIN members m ON sf.member_id = m.id
       WHERE sf.member_id = ?`,
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

  async findAllFullFamilies(): Promise<any[]> {
    const [rows] = await pool.execute<any[]>(
      `SELECT 
        sfd.id,
        sfd.name,
        sfd.responsible_id,
        sfd.cep,
        sfd.street,
        sfd.number,
        sfd.complement,
        sfd.neighborhood,
        sfd.city,
        sfd.state,
        sfd.host_name,
        sfd.host_age,
        sfd.is_converted,
        sfd.has_bible,
        sfd.meeting_days,
        sfd.created_at,
        m.full_name as responsible_name
       FROM small_family_details sfd
       LEFT JOIN members m ON sfd.responsible_id = m.id
       ORDER BY sfd.created_at DESC`
    );
    
    const families = [];
    
    for (const row of rows) {
      // Buscar membros da família
      const [members] = await pool.execute<any[]>(
        'SELECT id, name, age FROM small_family_members WHERE small_family_id = ?',
        [row.id]
      );
      
      // Parse meeting_days com segurança
      let meetingDays = [];
      try {
        if (row.meeting_days) {
          if (typeof row.meeting_days === 'string') {
            meetingDays = JSON.parse(row.meeting_days);
          } else if (Array.isArray(row.meeting_days)) {
            meetingDays = row.meeting_days;
          }
        }
      } catch (error) {
        console.error('Erro ao fazer parse de meeting_days:', error);
        meetingDays = [];
      }

      families.push({
        id: row.id,
        name: row.name,
        responsible_id: row.responsible_id,
        responsible_name: row.responsible_name || 'Responsável não encontrado',
        cep: row.cep,
        street: row.street,
        number: row.number,
        complement: row.complement,
        neighborhood: row.neighborhood,
        city: row.city,
        state: row.state,
        host_name: row.host_name,
        host_age: row.host_age,
        is_converted: Boolean(row.is_converted),
        has_bible: Boolean(row.has_bible),
        meeting_days: meetingDays,
        family_members: members,
        created_at: row.created_at
      });
    }
    
    return families;
  }

  async createFullFamily(data: any): Promise<number> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar se o responsável existe
      const [memberExists] = await connection.execute<any[]>(
        'SELECT id FROM members WHERE id = ?',
        [data.responsible_id]
      );
      
      if (memberExists.length === 0) {
        throw new Error('Responsável não encontrado');
      }
      
      // Inserir detalhes da pequena família
      const [result] = await connection.execute<any>(
        `INSERT INTO small_family_details (
          name, responsible_id, cep, street, number, complement, 
          neighborhood, city, state, host_name, host_age, 
          is_converted, has_bible, meeting_days
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.name,
          data.responsible_id,
          data.cep,
          data.street || null,
          data.number,
          data.complement || null,
          data.neighborhood || null,
          data.city || null,
          data.state || null,
          data.host_name,
          data.host_age,
          data.is_converted || false,
          data.has_bible || false,
          JSON.stringify(data.meeting_days || [])
        ]
      );
      
      const familyId = result.insertId;
      
      // Inserir membros da família (se houver)
      if (data.family_members && data.family_members.length > 0) {
        for (const member of data.family_members) {
          await connection.execute(
            'INSERT INTO small_family_members (small_family_id, name, age) VALUES (?, ?, ?)',
            [familyId, member.name, member.age]
          );
        }
      }
      
      await connection.commit();
      return familyId;
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

export default new SmallFamiliesService();
