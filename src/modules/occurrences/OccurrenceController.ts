import { Request, Response } from 'express';
import { OccurrenceService } from './OccurrenceService';

export class OccurrenceController {
  private occurrenceService: OccurrenceService;

  constructor() {
    this.occurrenceService = new OccurrenceService();
  }

  async createOccurrence(req: Request, res: Response) {
    try {
      const { ministry_id, date, reporter_name, witnesses, location, description } = req.body;

      // Validação básica
      if (!ministry_id || !date || !reporter_name || !location || !description) {
        return res.status(400).json({ 
          error: 'Campos obrigatórios: ministry_id, date, reporter_name, location, description' 
        });
      }

      const occurrence = await this.occurrenceService.createOccurrence({
        ministry_id,
        date,
        reporter_name,
        witnesses,
        location,
        description
      });

      res.status(201).json({ occurrence });
    } catch (error: any) {
      console.error('Erro ao criar ocorrência:', error);
      res.status(500).json({ error: error.message || 'Erro ao criar ocorrência' });
    }
  }

  async getAllOccurrences(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const ministryId = req.query.ministry_id as string | undefined;

      const result = await this.occurrenceService.getAllOccurrences(page, limit, ministryId);
      res.json(result);
    } catch (error: any) {
      console.error('Erro ao buscar ocorrências:', error);
      res.status(500).json({ error: error.message || 'Erro ao buscar ocorrências' });
    }
  }

  async getOccurrenceById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);

      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const occurrence = await this.occurrenceService.getOccurrenceById(id);
      res.json({ occurrence });
    } catch (error: any) {
      console.error('Erro ao buscar ocorrência:', error);
      
      if (error.message === 'Ocorrência não encontrada') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message || 'Erro ao buscar ocorrência' });
    }
  }

  async updateOccurrence(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const { date, reporter_name, witnesses, location, description } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const occurrence = await this.occurrenceService.updateOccurrence(id, {
        date,
        reporter_name,
        witnesses,
        location,
        description
      });

      res.json({ occurrence });
    } catch (error: any) {
      console.error('Erro ao atualizar ocorrência:', error);
      
      if (error.message === 'Ocorrência não encontrada') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message || 'Erro ao atualizar ocorrência' });
    }
  }

  async deleteOccurrence(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);

      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const occurrence = await this.occurrenceService.deleteOccurrence(id);
      res.json({ occurrence });
    } catch (error: any) {
      console.error('Erro ao excluir ocorrência:', error);
      
      if (error.message === 'Ocorrência não encontrada') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message || 'Erro ao excluir ocorrência' });
    }
  }
}
