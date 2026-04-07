import pool from '../../shared/database/connection';
import { CreateOccurrenceData, UpdateOccurrenceData } from './Occurrence';

function sanitizePagination(page: number, limit: number): { safePage: number; safeLimit: number; safeOffset: number } {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 10;
  return {
    safePage,
    safeLimit,
    safeOffset: (safePage - 1) * safeLimit,
  };
}

export class OccurrenceService {

  async createOccurrence(data: CreateOccurrenceData) {
    const insertQuery = `
      INSERT INTO occurrences (ministry_id, date, reporter_name, witnesses, location, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      data.ministry_id,
      data.date,
      data.reporter_name,
      data.witnesses || null,
      data.location,
      data.description
    ];

    try {
      const [insertResult] = await pool.execute<any>(insertQuery, values);
      const [result] = await pool.execute<any[]>('SELECT * FROM occurrences WHERE id = ?', [insertResult.insertId]);
      
      if (result.length === 0) {
        throw new Error('Falha ao recuperar o registro inserido');
      }
      
      return result[0];
    } catch (error: any) {
      console.error('Erro detalhado ao criar ocorrência:', error);
      throw new Error(`Erro ao criar ocorrência: ${error.message || error.code || 'Desconhecido'}`);
    }
  }

  async getAllOccurrences(page: number = 1, limit: number = 10, ministryId?: string) {
    const { safePage, safeLimit, safeOffset } = sanitizePagination(page, limit);
    
    let countQuery = 'SELECT COUNT(*) as total FROM occurrences';
    let dataQuery = 'SELECT * FROM occurrences';
    const queryParams: any[] = [];
    
    if (ministryId) {
      countQuery += ' WHERE ministry_id = ?';
      dataQuery += ' WHERE ministry_id = ?';
      queryParams.push(ministryId);
    }
    
    dataQuery += ` ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;

    try {
      const [countResult] = await pool.execute<any[]>(countQuery, queryParams);
      const [dataResult] = await pool.query<any[]>(dataQuery, queryParams);

      const countRow = countResult[0] as any;
      const total = countRow.total || countRow['COUNT(*)'] || 0;
      const totalPages = Math.ceil(total / safeLimit);

      return {
        occurrences: dataResult,
        total,
        page: safePage,
        totalPages,
        limit: safeLimit
      };
    } catch (error: any) {
      console.error('Erro ao buscar ocorrências:', error);
      throw new Error(`Erro ao buscar ocorrências: ${error.message}`);
    }
  }

  async getOccurrenceById(id: number) {
    const query = 'SELECT * FROM occurrences WHERE id = ?';
    
    try {
      const [result] = await pool.execute<any[]>(query, [id]);
      
      if (result.length === 0) {
        throw new Error('Ocorrência não encontrada');
      }
      
      return result[0];
    } catch (error) {
      throw new Error('Erro ao buscar ocorrência');
    }
  }

  async updateOccurrence(id: number, data: UpdateOccurrenceData) {
    const fields = [];
    const values = [];

    if (data.ministry_id !== undefined) {
      fields.push('ministry_id = ?');
      values.push(data.ministry_id);
    }
    if (data.date !== undefined) {
      fields.push('date = ?');
      values.push(data.date);
    }
    if (data.reporter_name !== undefined) {
      fields.push('reporter_name = ?');
      values.push(data.reporter_name);
    }
    if (data.witnesses !== undefined) {
      fields.push('witnesses = ?');
      values.push(data.witnesses);
    }
    if (data.location !== undefined) {
      fields.push('location = ?');
      values.push(data.location);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }

    if (fields.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    const query = `
      UPDATE occurrences 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    values.push(id);

    try {
      await pool.execute(query, values);
      
      // Busca o registro atualizado
      const selectQuery = 'SELECT * FROM occurrences WHERE id = ?';
      const [result] = await pool.execute<any[]>(selectQuery, [id]);
      
      if (result.length === 0) {
        throw new Error('Ocorrência não encontrada');
      }
      
      return result[0];
    } catch (error) {
      throw new Error('Erro ao atualizar ocorrência');
    }
  }

  async deleteOccurrence(id: number) {
    const query = 'DELETE FROM occurrences WHERE id = ?';
    
    try {
      const [result] = await pool.execute<any>(query, [id]);
      
      if (result.affectedRows === 0) {
        throw new Error('Ocorrência não encontrada');
      }
      
      return { deleted: true };
    } catch (error) {
      throw new Error('Erro ao excluir ocorrência');
    }
  }
}
