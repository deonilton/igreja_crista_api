import { Request, Response } from 'express';
import { AconselhamentoService } from './AconselhamentoService';

const aconselhamentoService = new AconselhamentoService();

export class AconselhamentoController {
  async createAconselhamento(req: Request, res: Response): Promise<Response> {
    try {
      const { nome_pessoa, telefone, data, horario, observacoes } = req.body;

      if (!nome_pessoa || !data || !horario) {
        return res.status(400).json({
          error: 'Campos obrigatórios: nome_pessoa, data, horario'
        });
      }

      const pastorId = (req as any).user?.id || 1;

      const appointment = await aconselhamentoService.createAconselhamento({
        nome_pessoa,
        telefone: telefone || '',
        data,
        horario,
        observacoes
      }, pastorId);

      return res.status(201).json({
        message: 'Aconselhamento agendado com sucesso',
        appointment
      });
    } catch (error: any) {
      console.error('Erro ao criar aconselhamento:', error);
      if (error.message.includes('Já existe')) {
        return res.status(400).json({
          error: error.message
        });
      }
      return res.status(500).json({
        error: 'Erro ao criar aconselhamento',
        details: error.message
      });
    }
  }

  async getAllAconselhamentos(req: Request, res: Response): Promise<Response> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await aconselhamentoService.getAllAconselhamentos(page, limit);

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Erro ao buscar aconselhamentos:', error);
      return res.status(500).json({
        error: 'Erro ao buscar aconselhamentos',
        details: error.message
      });
    }
  }

  async getAconselhamentoById(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id as string);

      if (isNaN(id)) {
        return res.status(400).json({
          error: 'ID inválido'
        });
      }

      const appointment = await aconselhamentoService.getAconselhamentoById(id);

      if (!appointment) {
        return res.status(404).json({
          error: 'Aconselhamento não encontrado'
        });
      }

      return res.status(200).json({ appointment });
    } catch (error: any) {
      console.error('Erro ao buscar aconselhamento:', error);
      return res.status(500).json({
        error: 'Erro ao buscar aconselhamento',
        details: error.message
      });
    }
  }

  async updateAconselhamento(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id as string);

      if (isNaN(id)) {
        return res.status(400).json({
          error: 'ID inválido'
        });
      }

      const data = req.body;

      const appointment = await aconselhamentoService.updateAconselhamento(id, data);

      if (!appointment) {
        return res.status(404).json({
          error: 'Aconselhamento não encontrado'
        });
      }

      return res.status(200).json({
        message: 'Aconselhamento atualizado com sucesso',
        appointment
      });
    } catch (error: any) {
      console.error('Erro ao atualizar aconselhamento:', error);
      return res.status(500).json({
        error: 'Erro ao atualizar aconselhamento',
        details: error.message
      });
    }
  }

  async deleteAconselhamento(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id as string);

      if (isNaN(id)) {
        return res.status(400).json({
          error: 'ID inválido'
        });
      }

      const deleted = await aconselhamentoService.deleteAconselhamento(id);

      if (!deleted) {
        return res.status(404).json({
          error: 'Aconselhamento não encontrado'
        });
      }

      return res.status(200).json({
        message: 'Aconselhamento deletado com sucesso'
      });
    } catch (error: any) {
      console.error('Erro ao deletar aconselhamento:', error);
      return res.status(500).json({
        error: 'Erro ao deletar aconselhamento',
        details: error.message
      });
    }
  }
}
