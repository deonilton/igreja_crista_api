import pool from '../../shared/database/connection';
import { Aconselhamento, CreateAconselhamentoDTO, UpdateAconselhamentoDTO } from './Aconselhamento';

export class AconselhamentoService {
  async createAconselhamento(data: CreateAconselhamentoDTO, pastorId: number): Promise<Aconselhamento> {
    const horarioParts = data.horario.split(' às ');
    const timeStart = horarioParts[0];
    
    const checkQuery = `SELECT * FROM aconselhamentos WHERE data = ? AND status = 'agendado' AND (
      horario LIKE CONCAT(?, ' às %') OR
      horario LIKE CONCAT('% às ', ?) OR
      (horario LIKE CONCAT(?, ' às ', ?) AND horario != ?)
    )`;
    
    try {
      const [checkResult] = await pool.execute<any[]>(checkQuery, [data.data, timeStart, timeStart, timeStart, timeStart, data.horario]);
      
      if (checkResult.length > 0) {
        throw new Error('Já existe um aconselhamento agendado para este período. Por favor, escolha outro horário.');
      }

      const query = `
        INSERT INTO aconselhamentos (pastor_id, nome_pessoa, telefone, data, horario, observacoes)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const [result] = await pool.execute<any>(query, [
        pastorId,
        data.nome_pessoa,
        data.telefone,
        data.data,
        data.horario,
        data.observacoes || ''
      ]);

      const insertId = result.insertId;
      
      const [rows] = await pool.execute<any[]>(
        'SELECT * FROM aconselhamentos WHERE id = ?',
        [insertId]
      );

      return rows[0] as Aconselhamento;
    } catch (error: any) {
      console.error('Erro ao criar aconselhamento:', error);
      throw new Error(`Erro ao criar aconselhamento: ${error.message}`);
    }
  }

  async getAllAconselhamentos(page: number = 1, limit: number = 50) {
    const offset = (page - 1) * limit;
    
    const countQuery = 'SELECT COUNT(*) as total FROM aconselhamentos';
    const dataQuery = `SELECT * FROM aconselhamentos ORDER BY data ASC, horario ASC LIMIT ${limit} OFFSET ${offset}`;

    try {
      const [countResult] = await pool.execute<any[]>(countQuery);
      const [dataResult] = await pool.query<any[]>(dataQuery);

      const total = countResult[0].total || countResult[0]['COUNT(*)'] || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        appointments: dataResult as Aconselhamento[],
        total,
        page,
        totalPages,
        limit
      };
    } catch (error: any) {
      console.error('Erro ao buscar aconselhamentos:', error);
      throw new Error(`Erro ao buscar aconselhamentos: ${error.message}`);
    }
  }

  async getAconselhamentoById(id: number): Promise<Aconselhamento | null> {
    const query = 'SELECT * FROM aconselhamentos WHERE id = ?';
    
    try {
      const [result] = await pool.execute<any[]>(query, [id]);
      
      if (result.length === 0) {
        return null;
      }

      return result[0] as Aconselhamento;
    } catch (error: any) {
      console.error('Erro ao buscar aconselhamento:', error);
      throw new Error(`Erro ao buscar aconselhamento: ${error.message}`);
    }
  }

  async updateAconselhamento(id: number, data: UpdateAconselhamentoDTO): Promise<Aconselhamento | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.nome_pessoa !== undefined) {
      fields.push('nome_pessoa = ?');
      values.push(data.nome_pessoa);
    }
    if (data.telefone !== undefined) {
      fields.push('telefone = ?');
      values.push(data.telefone);
    }
    if (data.data !== undefined) {
      fields.push('data = ?');
      values.push(data.data);
    }
    if (data.horario !== undefined) {
      fields.push('horario = ?');
      values.push(data.horario);
    }
    if (data.observacoes !== undefined) {
      fields.push('observacoes = ?');
      values.push(data.observacoes);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }

    if (fields.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    values.push(id);
    const query = `UPDATE aconselhamentos SET ${fields.join(', ')} WHERE id = ?`;

    try {
      await pool.execute(query, values);
      return await this.getAconselhamentoById(id);
    } catch (error: any) {
      console.error('Erro ao atualizar aconselhamento:', error);
      throw new Error(`Erro ao atualizar aconselhamento: ${error.message}`);
    }
  }

  async deleteAconselhamento(id: number): Promise<boolean> {
    const query = 'DELETE FROM aconselhamentos WHERE id = ?';
    
    try {
      const [result] = await pool.execute<any>(query, [id]);
      return result.affectedRows > 0;
    } catch (error: any) {
      console.error('Erro ao deletar aconselhamento:', error);
      throw new Error(`Erro ao deletar aconselhamento: ${error.message}`);
    }
  }
}
