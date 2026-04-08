import pool from '../../shared/database/connection';
import {
  EvangelismoLeader,
  CreateEvangelismoLeaderRequest,
  UpdateEvangelismoLeaderRequest,
  MemberSearchResult,
  CasaDePaz,
  CreateCasaDePazRequest,
  EvangelismoReport,
  CreateEvangelismoReportRequest,
  UpdateEvangelismoReportRequest
} from './evangelismo.types';

function sanitizePagination(page: number, limit: number): { safePage: number; safeLimit: number; safeOffset: number } {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 10;
  return {
    safePage,
    safeLimit,
    safeOffset: (safePage - 1) * safeLimit,
  };
}

class EvangelismoService {
  // ===== Líderes de Evangelismo =====
  
  async findAllLeaders(page: number = 1, limit: number = 10): Promise<{ casas: EvangelismoLeader[], total: number, page: number, totalPages: number }> {
    const { safePage, safeLimit, safeOffset } = sanitizePagination(page, limit);
    
    const [countResult] = await pool.execute<any[]>(
      'SELECT COUNT(*) as total FROM evangelismo_leaders'
    );
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / safeLimit);
    
    const [rows] = await pool.execute<any[]>(
      `SELECT 
        el.id,
        el.member_id,
        el.created_at,
        el.updated_at,
        m.id as member_id,
        m.full_name,
        m.email,
        m.phone
       FROM evangelismo_leaders el
       INNER JOIN members m ON el.member_id = m.id
       ORDER BY el.created_at DESC
       LIMIT ${safeLimit} OFFSET ${safeOffset}`
    );
    
    const casas: EvangelismoLeader[] = rows.map(row => ({
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
      casas,
      total,
      page: safePage,
      totalPages
    };
  }

  async findLeaderById(id: number): Promise<EvangelismoLeader | null> {
    const [rows] = await pool.execute<any[]>(
      `SELECT 
        el.id,
        el.member_id,
        el.created_at,
        el.updated_at,
        m.id as member_id,
        m.full_name,
        m.email,
        m.phone
       FROM evangelismo_leaders el
       INNER JOIN members m ON el.member_id = m.id
       WHERE el.id = ?`,
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

  async createLeader(data: CreateEvangelismoLeaderRequest): Promise<number> {
    const [memberExists] = await pool.execute<any[]>(
      'SELECT id FROM members WHERE id = ?',
      [data.member_id]
    );
    
    if (memberExists.length === 0) {
      throw new Error('Membro não encontrado');
    }
    
    const [alreadyExists] = await pool.execute<any[]>(
      'SELECT id FROM evangelismo_leaders WHERE member_id = ?',
      [data.member_id]
    );
    
    if (alreadyExists.length > 0) {
      throw new Error('Este membro já é um líder de evangelismo');
    }
    
    const [result] = await pool.execute<any>(
      'INSERT INTO evangelismo_leaders (member_id) VALUES (?)',
      [data.member_id]
    );
    return result.insertId;
  }

  async updateLeader(id: number, data: UpdateEvangelismoLeaderRequest): Promise<void> {
    const [leaderExists] = await pool.execute<any[]>(
      'SELECT id FROM evangelismo_leaders WHERE id = ?',
      [id]
    );
    
    if (leaderExists.length === 0) {
      throw new Error('Líder de evangelismo não encontrado');
    }
    
    const [memberExists] = await pool.execute<any[]>(
      'SELECT id FROM members WHERE id = ?',
      [data.member_id]
    );
    
    if (memberExists.length === 0) {
      throw new Error('Membro não encontrado');
    }
    
    const [alreadyExists] = await pool.execute<any[]>(
      'SELECT id FROM evangelismo_leaders WHERE member_id = ? AND id != ?',
      [data.member_id, id]
    );
    
    if (alreadyExists.length > 0) {
      throw new Error('Este membro já é um líder de evangelismo');
    }
    
    await pool.execute(
      'UPDATE evangelismo_leaders SET member_id = ? WHERE id = ?',
      [data.member_id, id]
    );
  }

  async deleteLeader(id: number): Promise<void> {
    const [leaderExists] = await pool.execute<any[]>(
      'SELECT id FROM evangelismo_leaders WHERE id = ?',
      [id]
    );
    
    if (leaderExists.length === 0) {
      throw new Error('Líder de evangelismo não encontrado');
    }
    
    await pool.execute('DELETE FROM evangelismo_leaders WHERE id = ?', [id]);
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
       FROM evangelismo_leaders el
       INNER JOIN members m ON el.member_id = m.id`
    );
    
    return {
      total: rows[0].total || 0,
      men: rows[0].men || 0,
      women: rows[0].women || 0
    };
  }

  // ===== Casas de Paz =====
  
  async findAllCasasDePaz(): Promise<CasaDePaz[]> {
    const [rows] = await pool.execute<any[]>(
      `SELECT 
        cdp.id,
        cdp.name,
        cdp.responsible_id,
        cdp.cep,
        cdp.street,
        cdp.number,
        cdp.complement,
        cdp.neighborhood,
        cdp.city,
        cdp.state,
        cdp.host_name,
        cdp.host_age,
        cdp.is_converted,
        cdp.has_bible,
        cdp.meeting_days,
        cdp.created_at,
        cdp.updated_at,
        m.full_name as responsible_name
       FROM casas_de_paz cdp
       LEFT JOIN members m ON cdp.responsible_id = m.id
       ORDER BY cdp.created_at DESC`
    );
    
    const casas: CasaDePaz[] = [];
    
    for (const row of rows) {
      // Buscar membros da família
      const [members] = await pool.execute<any[]>(
        'SELECT id, name, age FROM casa_de_paz_members WHERE casa_de_paz_id = ?',
        [row.id]
      );
      
      // Parse meeting_days com segurança
      let meetingDays: string[] = [];
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

      casas.push({
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
        created_at: row.created_at,
        updated_at: row.updated_at
      });
    }
    
    return casas;
  }

  async findCasaDePazById(id: number): Promise<CasaDePaz | null> {
    const [rows] = await pool.execute<any[]>(
      `SELECT 
        cdp.id,
        cdp.name,
        cdp.responsible_id,
        cdp.cep,
        cdp.street,
        cdp.number,
        cdp.complement,
        cdp.neighborhood,
        cdp.city,
        cdp.state,
        cdp.host_name,
        cdp.host_age,
        cdp.is_converted,
        cdp.has_bible,
        cdp.meeting_days,
        cdp.created_at,
        cdp.updated_at,
        m.full_name as responsible_name
       FROM casas_de_paz cdp
       LEFT JOIN members m ON cdp.responsible_id = m.id
       WHERE cdp.id = ?`,
      [id]
    );
    
    if (rows.length === 0) return null;
    
    const row = rows[0];
    
    // Buscar membros da família
    const [members] = await pool.execute<any[]>(
      'SELECT id, name, age FROM casa_de_paz_members WHERE casa_de_paz_id = ?',
      [row.id]
    );
    
    // Parse meeting_days com segurança
    let meetingDays: string[] = [];
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
    
    return {
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
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  async createCasaDePaz(data: CreateCasaDePazRequest): Promise<number> {
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
      
      // Inserir Casa de Paz
      const [result] = await connection.execute<any>(
        `INSERT INTO casas_de_paz (
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
      
      const casaId = result.insertId;
      
      // Inserir membros da família (se houver)
      if (data.family_members && data.family_members.length > 0) {
        for (const member of data.family_members) {
          await connection.execute(
            'INSERT INTO casa_de_paz_members (casa_de_paz_id, name, age) VALUES (?, ?, ?)',
            [casaId, member.name, member.age]
          );
        }
      }
      
      await connection.commit();
      return casaId;
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // ===== Relatórios de Evangelismo =====
  
  async findAllReports(page: number = 1, limit: number = 10): Promise<{ reports: EvangelismoReport[], total: number, page: number, totalPages: number }> {
    const { safePage, safeLimit, safeOffset } = sanitizePagination(page, limit);
    
    const [countResult] = await pool.execute<any[]>(
      'SELECT COUNT(*) as total FROM evangelismo_reports'
    );
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / safeLimit);
    
    const [rows] = await pool.execute<any[]>(
      `SELECT 
        er.id,
        er.casa_de_paz_id,
        er.cult_date,
        er.horario_inicio,
        er.horario_termino,
        er.responsavel,
        er.endereco,
        er.bairro,
        er.participantes,
        er.new_visitors,
        er.conversions,
        er.offeringAmount,
        er.observacoes,
        er.created_at,
        er.updated_at,
        cdp.name as casa_name
       FROM evangelismo_reports er
       INNER JOIN casas_de_paz cdp ON er.casa_de_paz_id = cdp.id
       ORDER BY er.cult_date DESC, er.created_at DESC
       LIMIT ${safeLimit} OFFSET ${safeOffset}`
    );
    
    const reports: EvangelismoReport[] = rows.map(row => ({
      id: row.id,
      casa_de_paz_id: row.casa_de_paz_id,
      cult_date: row.cult_date,
      horario_inicio: row.horario_inicio,
      horario_termino: row.horario_termino,
      responsavel: row.responsavel,
      endereco: row.endereco,
      bairro: row.bairro,
      participantes: row.participantes,
      new_visitors: row.new_visitors || 0,
      conversions: row.conversions || 0,
      offeringAmount: row.offeringAmount || 0,
      observacoes: row.observacoes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      casa_de_paz: {
        id: row.casa_de_paz_id,
        name: row.casa_name
      }
    }));
    
    return {
      reports,
      total,
      page: safePage,
      totalPages
    };
  }

  async findReportById(id: number): Promise<EvangelismoReport | null> {
    const [rows] = await pool.execute<any[]>(
      `SELECT 
        er.id,
        er.casa_de_paz_id,
        er.cult_date,
        er.horario_inicio,
        er.horario_termino,
        er.responsavel,
        er.endereco,
        er.bairro,
        er.participantes,
        er.new_visitors,
        er.conversions,
        er.offeringAmount,
        er.observacoes,
        er.created_at,
        er.updated_at,
        cdp.name as casa_name
       FROM evangelismo_reports er
       INNER JOIN casas_de_paz cdp ON er.casa_de_paz_id = cdp.id
       WHERE er.id = ?`,
      [id]
    );
    
    if (rows.length === 0) return null;
    
    const row = rows[0];
    return {
      id: row.id,
      casa_de_paz_id: row.casa_de_paz_id,
      cult_date: row.cult_date,
      horario_inicio: row.horario_inicio,
      horario_termino: row.horario_termino,
      responsavel: row.responsavel,
      endereco: row.endereco,
      bairro: row.bairro,
      participantes: row.participantes,
      new_visitors: row.new_visitors || 0,
      conversions: row.conversions || 0,
      offeringAmount: row.offeringAmount || 0,
      observacoes: row.observacoes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      casa_de_paz: {
        id: row.casa_de_paz_id,
        name: row.casa_name
      }
    };
  }

  async createReport(data: CreateEvangelismoReportRequest): Promise<number> {
    // Verificar se a Casa de Paz existe
    const [casaExists] = await pool.execute<any[]>(
      'SELECT id FROM casas_de_paz WHERE id = ?',
      [data.casa_de_paz_id]
    );
    
    if (casaExists.length === 0) {
      throw new Error('Casa de Paz não encontrada');
    }
    
    const [result] = await pool.execute<any>(
      `INSERT INTO evangelismo_reports (
        casa_de_paz_id, cult_date, horario_inicio, horario_termino,
        responsavel, endereco, bairro, participantes,
        new_visitors, conversions, offeringAmount, observacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.casa_de_paz_id,
        data.cult_date,
        data.horario_inicio || null,
        data.horario_termino || null,
        data.responsavel,
        data.endereco || null,
        data.bairro || null,
        data.participantes || null,
        data.new_visitors || 0,
        data.conversions || 0,
        data.offeringAmount || 0,
        data.observacoes || null
      ]
    );
    
    return result.insertId;
  }

  async updateReport(id: number, data: UpdateEvangelismoReportRequest): Promise<void> {
    const [reportExists] = await pool.execute<any[]>(
      'SELECT id FROM evangelismo_reports WHERE id = ?',
      [id]
    );
    
    if (reportExists.length === 0) {
      throw new Error('Relatório não encontrado');
    }
    
    // Verificar se a Casa de Paz existe
    const [casaExists] = await pool.execute<any[]>(
      'SELECT id FROM casas_de_paz WHERE id = ?',
      [data.casa_de_paz_id]
    );
    
    if (casaExists.length === 0) {
      throw new Error('Casa de Paz não encontrada');
    }
    
    await pool.execute(
      `UPDATE evangelismo_reports SET
        casa_de_paz_id = ?,
        cult_date = ?,
        horario_inicio = ?,
        horario_termino = ?,
        responsavel = ?,
        endereco = ?,
        bairro = ?,
        participantes = ?,
        new_visitors = ?,
        conversions = ?,
        offeringAmount = ?,
        observacoes = ?
       WHERE id = ?`,
      [
        data.casa_de_paz_id,
        data.cult_date,
        data.horario_inicio || null,
        data.horario_termino || null,
        data.responsavel,
        data.endereco || null,
        data.bairro || null,
        data.participantes || null,
        data.new_visitors || 0,
        data.conversions || 0,
        data.offeringAmount || 0,
        data.observacoes || null,
        id
      ]
    );
  }

  async deleteReport(id: number): Promise<void> {
    const [reportExists] = await pool.execute<any[]>(
      'SELECT id FROM evangelismo_reports WHERE id = ?',
      [id]
    );
    
    if (reportExists.length === 0) {
      throw new Error('Relatório não encontrado');
    }
    
    await pool.execute('DELETE FROM evangelismo_reports WHERE id = ?', [id]);
  }
}

export default new EvangelismoService();
