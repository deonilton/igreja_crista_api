import { Request, Response } from 'express';
import { CultReportService } from './CultReportService';

const cultReportService = new CultReportService();

export class CultReportController {
  async createCultReport(req: Request, res: Response): Promise<Response> {
    try {
      const {
        cult_type_familia, cult_type_oracao, cult_type_adolescentes, cult_type_outros, cult_type_outros_texto,
        cult_date, horario_inicio, horario_termino, ministro, igreja, assunto, texto,
        lideranca, freq_adultos, freq_criancas, freq_adolescentes, freq_visitantes, freq_total,
        diacono_responsavel, casal_recepcao_1, casal_recepcao_2, casal_santa_ceia_1, casal_santa_ceia_2,
        programacao, ocorrencias_gerais, responsavel
      } = req.body;

      if (!cult_date || !ministro || !assunto) {
        return res.status(400).json({
          error: 'Campos obrigatórios: ministro, assunto, cult_date'
        });
      }

      const report = await cultReportService.createCultReport({
        cult_type_familia: cult_type_familia || false,
        cult_type_oracao: cult_type_oracao || false,
        cult_type_adolescentes: cult_type_adolescentes || false,
        cult_type_outros: cult_type_outros || false,
        cult_type_outros_texto: cult_type_outros_texto || '',
        cult_date,
        horario_inicio: horario_inicio || '',
        horario_termino: horario_termino || '',
        ministro,
        igreja: igreja || '',
        assunto,
        texto: texto || '',
        lideranca: lideranca || [],
        freq_adultos: freq_adultos || 0,
        freq_criancas: freq_criancas || 0,
        freq_adolescentes: freq_adolescentes || 0,
        freq_visitantes: freq_visitantes || 0,
        freq_total: freq_total || 0,
        diacono_responsavel: diacono_responsavel || '',
        casal_recepcao_1: casal_recepcao_1 || '',
        casal_recepcao_2: casal_recepcao_2 || '',
        casal_santa_ceia_1: casal_santa_ceia_1 || '',
        casal_santa_ceia_2: casal_santa_ceia_2 || '',
        programacao: programacao || [],
        ocorrencias_gerais: ocorrencias_gerais || '',
        responsavel: responsavel || ''
      });

      return res.status(201).json({
        message: 'Relatório de culto criado com sucesso',
        report
      });
    } catch (error: any) {
      console.error('Erro ao criar relatório de culto:', error);
      return res.status(500).json({
        error: 'Erro ao criar relatório de culto',
        details: error.message
      });
    }
  }

  async getAllCultReports(req: Request, res: Response): Promise<Response> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await cultReportService.getAllCultReports(page, limit);

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Erro ao buscar relatórios de culto:', error);
      return res.status(500).json({
        error: 'Erro ao buscar relatórios de culto',
        details: error.message
      });
    }
  }

  async getCultReportById(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id as string);

      if (isNaN(id)) {
        return res.status(400).json({
          error: 'ID inválido'
        });
      }

      const report = await cultReportService.getCultReportById(id);

      if (!report) {
        return res.status(404).json({
          error: 'Relatório de culto não encontrado'
        });
      }

      return res.status(200).json({ report });
    } catch (error: any) {
      console.error('Erro ao buscar relatório de culto:', error);
      return res.status(500).json({
        error: 'Erro ao buscar relatório de culto',
        details: error.message
      });
    }
  }

  async updateCultReport(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id as string);

      if (isNaN(id)) {
        return res.status(400).json({
          error: 'ID inválido'
        });
      }

      const data = req.body;

      const report = await cultReportService.updateCultReport(id, data);

      if (!report) {
        return res.status(404).json({
          error: 'Relatório de culto não encontrado'
        });
      }

      return res.status(200).json({
        message: 'Relatório de culto atualizado com sucesso',
        report
      });
    } catch (error: any) {
      console.error('Erro ao atualizar relatório de culto:', error);
      return res.status(500).json({
        error: 'Erro ao atualizar relatório de culto',
        details: error.message
      });
    }
  }

  async deleteCultReport(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id as string);

      if (isNaN(id)) {
        return res.status(400).json({
          error: 'ID inválido'
        });
      }

      const deleted = await cultReportService.deleteCultReport(id);

      if (!deleted) {
        return res.status(404).json({
          error: 'Relatório de culto não encontrado'
        });
      }

      return res.status(200).json({
        message: 'Relatório de culto deletado com sucesso'
      });
    } catch (error: any) {
      console.error('Erro ao deletar relatório de culto:', error);
      return res.status(500).json({
        error: 'Erro ao deletar relatório de culto',
        details: error.message
      });
    }
  }
}
