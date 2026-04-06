import { Request, Response } from 'express';
import smallFamilyReportsService from './small-family-reports.service';
import { CreateSmallFamilyReportRequest, UpdateSmallFamilyReportRequest } from './small-family-reports.types';

class SmallFamilyReportsController {
  async findAll(req: Request, res: Response) {
    try {
      const page = parseInt((req.query.page as string) || '1');
      const limit = parseInt((req.query.limit as string) || '10');
      
      const result = await smallFamilyReportsService.findAll(page, limit);
      res.json(result);
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
      res.status(500).json({ message: 'Erro ao buscar relatórios' });
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const id = parseInt((req.params.id as string));
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      const report = await smallFamilyReportsService.findById(id);
      
      if (!report) {
        return res.status(404).json({ message: 'Relatório não encontrado' });
      }
      
      res.json(report);
    } catch (error) {
      console.error('Erro ao buscar relatório:', error);
      res.status(500).json({ message: 'Erro ao buscar relatório' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data: CreateSmallFamilyReportRequest = req.body;
      
      if (!data.family_id || isNaN(data.family_id)) {
        return res.status(400).json({ message: 'family_id é obrigatório e deve ser um número válido' });
      }
      
      if (!data.cult_date) {
        return res.status(400).json({ message: 'cult_date é obrigatório' });
      }
      
      if (!data.responsavel) {
        return res.status(400).json({ message: 'responsavel é obrigatório' });
      }
      
      const id = await smallFamilyReportsService.create(data);
      const report = await smallFamilyReportsService.findById(id);
      
      res.status(201).json(report);
    } catch (error: any) {
      console.error('Erro ao criar relatório:', error);
      res.status(500).json({ message: 'Erro ao criar relatório' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = parseInt((req.params.id as string));
      const data: UpdateSmallFamilyReportRequest = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      await smallFamilyReportsService.update(id, data);
      const report = await smallFamilyReportsService.findById(id);
      
      res.json(report);
    } catch (error: any) {
      console.error('Erro ao atualizar relatório:', error);
      res.status(500).json({ message: 'Erro ao atualizar relatório' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt((req.params.id as string));
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      await smallFamilyReportsService.delete(id);
      
      res.status(204).send();
    } catch (error: any) {
      console.error('Erro ao excluir relatório:', error);
      res.status(500).json({ message: 'Erro ao excluir relatório' });
    }
  }

  async findByFamilyId(req: Request, res: Response) {
    try {
      const familyId = parseInt((req.params.familyId as string));
      const page = parseInt((req.query.page as string) || '1');
      const limit = parseInt((req.query.limit as string) || '10');
      
      if (isNaN(familyId)) {
        return res.status(400).json({ message: 'ID da família inválido' });
      }
      
      const result = await smallFamilyReportsService.findByFamilyId(familyId, page, limit);
      res.json(result);
    } catch (error) {
      console.error('Erro ao buscar relatórios da família:', error);
      res.status(500).json({ message: 'Erro ao buscar relatórios da família' });
    }
  }
}

export default new SmallFamilyReportsController();
