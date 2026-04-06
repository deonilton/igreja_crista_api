import pool from '../../shared/database/connection';
import { SmallFamilyReport, CreateSmallFamilyReportRequest, UpdateSmallFamilyReportRequest } from './small-family-reports.types';

function sanitizePagination(page: number, limit: number): { safePage: number; safeLimit: number; safeOffset: number } {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 10;
  return {
    safePage,
    safeLimit,
    safeOffset: (safePage - 1) * safeLimit,
  };
}

class SmallFamilyReportsService {
  async findAll(page: number = 1, limit: number = 10): Promise<{ reports: SmallFamilyReport[], total: number, page: number, totalPages: number }> {
    const { safePage, safeLimit, safeOffset } = sanitizePagination(page, limit);
    
    const [countResult] = await pool.execute<any[]>(
      'SELECT COUNT(*) as total FROM small_family_reports'
    );
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / safeLimit);
    
    const [rows] = await pool.execute<any[]>(
      `SELECT 
        r.id,
        r.family_id,
        r.cult_date,
        r.horario_inicio,
        r.horario_termino,
        r.responsavel,
        r.endereco,
        r.bairro,
        r.participantes,
        r.offering_amount as offering_amount,
        r.observacoes,
        r.created_at,
        r.updated_at
       FROM small_family_reports r
       ORDER BY r.cult_date DESC, r.created_at DESC
       LIMIT ${safeLimit} OFFSET ${safeOffset}`
    );
    
    const reports: SmallFamilyReport[] = rows.map(row => ({
      id: row.id,
      family_id: row.family_id,
      cult_date: row.cult_date,
      horario_inicio: row.horario_inicio,
      horario_termino: row.horario_termino,
      responsavel: row.responsavel,
      endereco: row.endereco,
      bairro: row.bairro,
      participantes: row.participantes,
      OfferingAmount: row.offering_amount,
      observacoes: row.observacoes,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
    
    return {
      reports,
      total,
      page: safePage,
      totalPages
    };
  }

  async findById(id: number): Promise<SmallFamilyReport | null> {
    const [rows] = await pool.execute<any[]>(
      `SELECT 
        r.id,
        r.family_id,
        r.cult_date,
        r.horario_inicio,
        r.horario_termino,
        r.responsavel,
        r.endereco,
        r.bairro,
        r.participantes,
        r.offering_amount as offering_amount,
        r.observacoes,
        r.created_at,
        r.updated_at
       FROM small_family_reports r
       WHERE r.id = ?`,
      [id]
    );
    
    if (rows.length === 0) return null;
    
    const row = rows[0];
    return {
      id: row.id,
      family_id: row.family_id,
      cult_date: row.cult_date,
      horario_inicio: row.horario_inicio,
      horario_termino: row.horario_termino,
      responsavel: row.responsavel,
      endereco: row.endereco,
      bairro: row.bairro,
      participantes: row.participantes,
      OfferingAmount: row.offering_amount,
      observacoes: row.observacoes,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  async create(data: CreateSmallFamilyReportRequest): Promise<number> {
    const [result] = await pool.execute<any>(
      `INSERT INTO small_family_reports 
       (family_id, cult_date, horario_inicio, horario_termino, responsavel, endereco, bairro, participantes, offering_amount, observacoes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.family_id,
        data.cult_date,
        data.horario_inicio || '',
        data.horario_termino || '',
        data.responsavel,
        data.endereco || '',
        data.bairro || '',
        data.participantes || '',
        data.OfferingAmount || 0,
        data.observacoes || ''
      ]
    );
    return result.insertId;
  }

  async update(id: number, data: UpdateSmallFamilyReportRequest): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.family_id !== undefined) {
      updates.push('family_id = ?');
      params.push(data.family_id);
    }
    if (data.cult_date !== undefined) {
      updates.push('cult_date = ?');
      params.push(data.cult_date);
    }
    if (data.horario_inicio !== undefined) {
      updates.push('horario_inicio = ?');
      params.push(data.horario_inicio);
    }
    if (data.horario_termino !== undefined) {
      updates.push('horario_termino = ?');
      params.push(data.horario_termino);
    }
    if (data.responsavel !== undefined) {
      updates.push('responsavel = ?');
      params.push(data.responsavel);
    }
    if (data.endereco !== undefined) {
      updates.push('endereco = ?');
      params.push(data.endereco);
    }
    if (data.bairro !== undefined) {
      updates.push('bairro = ?');
      params.push(data.bairro);
    }
    if (data.participantes !== undefined) {
      updates.push('participantes = ?');
      params.push(data.participantes);
    }
    if (data.OfferingAmount !== undefined) {
      updates.push('offering_amount = ?');
      params.push(data.OfferingAmount);
    }
    if (data.observacoes !== undefined) {
      updates.push('observacoes = ?');
      params.push(data.observacoes);
    }

    if (updates.length === 0) return;

    params.push(id);
    await pool.execute(
      `UPDATE small_family_reports SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
  }

  async delete(id: number): Promise<void> {
    await pool.execute('DELETE FROM small_family_reports WHERE id = ?', [id]);
  }

  async findByFamilyId(familyId: number, page: number = 1, limit: number = 10): Promise<{ reports: SmallFamilyReport[], total: number, page: number, totalPages: number }> {
    const { safePage, safeLimit, safeOffset } = sanitizePagination(page, limit);
    
    const [countResult] = await pool.execute<any[]>(
      'SELECT COUNT(*) as total FROM small_family_reports WHERE family_id = ?',
      [familyId]
    );
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / safeLimit);
    
    const [rows] = await pool.execute<any[]>(
      `SELECT 
        r.id,
        r.family_id,
        r.cult_date,
        r.horario_inicio,
        r.horario_termino,
        r.responsavel,
        r.endereco,
        r.bairro,
        r.participantes,
        r.offering_amount as offering_amount,
        r.observacoes,
        r.created_at,
        r.updated_at
       FROM small_family_reports r
       WHERE r.family_id = ?
       ORDER BY r.cult_date DESC, r.created_at DESC
       LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      [familyId]
    );
    
    const reports: SmallFamilyReport[] = rows.map(row => ({
      id: row.id,
      family_id: row.family_id,
      cult_date: row.cult_date,
      horario_inicio: row.horario_inicio,
      horario_termino: row.horario_termino,
      responsavel: row.responsavel,
      endereco: row.endereco,
      bairro: row.bairro,
      participantes: row.participantes,
      OfferingAmount: row.offering_amount,
      observacoes: row.observacoes,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
    
    return {
      reports,
      total,
      page: safePage,
      totalPages
    };
  }
}

export default new SmallFamilyReportsService();
