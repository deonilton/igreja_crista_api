import pool from '../../shared/database/connection';
import { CultReport, CreateCultReportDTO, UpdateCultReportDTO } from './CultReport';

function sanitizePagination(page: number, limit: number): { safePage: number; safeLimit: number; safeOffset: number } {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 10;
  return {
    safePage,
    safeLimit,
    safeOffset: (safePage - 1) * safeLimit,
  };
}

export class CultReportService {
  async createCultReport(data: CreateCultReportDTO): Promise<CultReport> {
    const query = `
      INSERT INTO cult_reports 
      (cult_type_familia, cult_type_oracao, cult_type_adolescentes, cult_type_outros, cult_type_outros_texto,
       cult_date, horario_inicio, horario_termino, ministro, igreja, assunto, texto,
       lideranca, freq_adultos, freq_criancas, freq_adolescentes, freq_visitantes, freq_total,
       diacono_responsavel, casal_recepcao_1, casal_recepcao_2, casal_santa_ceia_1, casal_santa_ceia_2,
       programacao, ocorrencias_gerais, responsavel)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const [result] = await pool.execute<any>(query, [
        data.cult_type_familia,
        data.cult_type_oracao,
        data.cult_type_adolescentes,
        data.cult_type_outros,
        data.cult_type_outros_texto,
        data.cult_date,
        data.horario_inicio,
        data.horario_termino,
        data.ministro,
        data.igreja,
        data.assunto,
        data.texto,
        JSON.stringify(data.lideranca),
        data.freq_adultos,
        data.freq_criancas,
        data.freq_adolescentes,
        data.freq_visitantes,
        data.freq_total,
        data.diacono_responsavel,
        data.casal_recepcao_1,
        data.casal_recepcao_2,
        data.casal_santa_ceia_1,
        data.casal_santa_ceia_2,
        JSON.stringify(data.programacao),
        data.ocorrencias_gerais,
        data.responsavel
      ]);

      const insertId = result.insertId;
      
      const [rows] = await pool.execute<any[]>(
        'SELECT * FROM cult_reports WHERE id = ?',
        [insertId]
      );

      return rows[0] as CultReport;
    } catch (error: any) {
      console.error('Erro ao criar relatório de culto:', error);
      throw new Error(`Erro ao criar relatório de culto: ${error.message}`);
    }
  }

  async getAllCultReports(page: number = 1, limit: number = 10) {
    const { safePage, safeLimit, safeOffset } = sanitizePagination(page, limit);
    
    const countQuery = 'SELECT COUNT(*) as total FROM cult_reports';
    const dataQuery = `SELECT * FROM cult_reports ORDER BY cult_date DESC, created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;

    try {
      const [countResult] = await pool.execute<any[]>(countQuery);
      const [dataResult] = await pool.query<any[]>(dataQuery);

      const total = countResult[0].total || countResult[0]['COUNT(*)'] || 0;
      const totalPages = Math.ceil(total / safeLimit);

      return {
        reports: dataResult as CultReport[],
        total,
        page: safePage,
        totalPages,
        limit: safeLimit
      };
    } catch (error: any) {
      console.error('Erro ao buscar relatórios de culto:', error);
      throw new Error(`Erro ao buscar relatórios de culto: ${error.message}`);
    }
  }

  async getCultReportById(id: number): Promise<CultReport | null> {
    const query = 'SELECT * FROM cult_reports WHERE id = ?';
    
    try {
      const [result] = await pool.execute<any[]>(query, [id]);
      
      if (result.length === 0) {
        return null;
      }

      return result[0] as CultReport;
    } catch (error: any) {
      console.error('Erro ao buscar relatório de culto:', error);
      throw new Error(`Erro ao buscar relatório de culto: ${error.message}`);
    }
  }

  async updateCultReport(id: number, data: UpdateCultReportDTO): Promise<CultReport | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.cult_type_familia !== undefined) {
      fields.push('cult_type_familia = ?');
      values.push(data.cult_type_familia);
    }
    if (data.cult_type_oracao !== undefined) {
      fields.push('cult_type_oracao = ?');
      values.push(data.cult_type_oracao);
    }
    if (data.cult_type_adolescentes !== undefined) {
      fields.push('cult_type_adolescentes = ?');
      values.push(data.cult_type_adolescentes);
    }
    if (data.cult_type_outros !== undefined) {
      fields.push('cult_type_outros = ?');
      values.push(data.cult_type_outros);
    }
    if (data.cult_type_outros_texto !== undefined) {
      fields.push('cult_type_outros_texto = ?');
      values.push(data.cult_type_outros_texto);
    }
    if (data.cult_date !== undefined) {
      fields.push('cult_date = ?');
      values.push(data.cult_date);
    }
    if (data.horario_inicio !== undefined) {
      fields.push('horario_inicio = ?');
      values.push(data.horario_inicio);
    }
    if (data.horario_termino !== undefined) {
      fields.push('horario_termino = ?');
      values.push(data.horario_termino);
    }
    if (data.ministro !== undefined) {
      fields.push('ministro = ?');
      values.push(data.ministro);
    }
    if (data.igreja !== undefined) {
      fields.push('igreja = ?');
      values.push(data.igreja);
    }
    if (data.assunto !== undefined) {
      fields.push('assunto = ?');
      values.push(data.assunto);
    }
    if (data.texto !== undefined) {
      fields.push('texto = ?');
      values.push(data.texto);
    }
    if (data.lideranca !== undefined) {
      fields.push('lideranca = ?');
      values.push(JSON.stringify(data.lideranca));
    }
    if (data.freq_adultos !== undefined) {
      fields.push('freq_adultos = ?');
      values.push(data.freq_adultos);
    }
    if (data.freq_criancas !== undefined) {
      fields.push('freq_criancas = ?');
      values.push(data.freq_criancas);
    }
    if (data.freq_adolescentes !== undefined) {
      fields.push('freq_adolescentes = ?');
      values.push(data.freq_adolescentes);
    }
    if (data.freq_visitantes !== undefined) {
      fields.push('freq_visitantes = ?');
      values.push(data.freq_visitantes);
    }
    if (data.freq_total !== undefined) {
      fields.push('freq_total = ?');
      values.push(data.freq_total);
    }
    if (data.diacono_responsavel !== undefined) {
      fields.push('diacono_responsavel = ?');
      values.push(data.diacono_responsavel);
    }
    if (data.casal_recepcao_1 !== undefined) {
      fields.push('casal_recepcao_1 = ?');
      values.push(data.casal_recepcao_1);
    }
    if (data.casal_recepcao_2 !== undefined) {
      fields.push('casal_recepcao_2 = ?');
      values.push(data.casal_recepcao_2);
    }
    if (data.casal_santa_ceia_1 !== undefined) {
      fields.push('casal_santa_ceia_1 = ?');
      values.push(data.casal_santa_ceia_1);
    }
    if (data.casal_santa_ceia_2 !== undefined) {
      fields.push('casal_santa_ceia_2 = ?');
      values.push(data.casal_santa_ceia_2);
    }
    if (data.programacao !== undefined) {
      fields.push('programacao = ?');
      values.push(JSON.stringify(data.programacao));
    }
    if (data.ocorrencias_gerais !== undefined) {
      fields.push('ocorrencias_gerais = ?');
      values.push(data.ocorrencias_gerais);
    }
    if (data.responsavel !== undefined) {
      fields.push('responsavel = ?');
      values.push(data.responsavel);
    }

    if (fields.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    values.push(id);
    const query = `UPDATE cult_reports SET ${fields.join(', ')} WHERE id = ?`;

    try {
      await pool.execute(query, values);
      return await this.getCultReportById(id);
    } catch (error: any) {
      console.error('Erro ao atualizar relatório de culto:', error);
      throw new Error(`Erro ao atualizar relatório de culto: ${error.message}`);
    }
  }

  async deleteCultReport(id: number): Promise<boolean> {
    const query = 'DELETE FROM cult_reports WHERE id = ?';
    
    try {
      const [result] = await pool.execute<any>(query, [id]);
      return result.affectedRows > 0;
    } catch (error: any) {
      console.error('Erro ao deletar relatório de culto:', error);
      throw new Error(`Erro ao deletar relatório de culto: ${error.message}`);
    }
  }
}
