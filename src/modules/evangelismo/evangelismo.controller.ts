import { Request, Response } from 'express';
import evangelismoService from './evangelismo.service';
import { CreateEvangelismoLeaderRequest, UpdateEvangelismoLeaderRequest, CreateCasaDePazRequest, CreateEvangelismoReportRequest, UpdateEvangelismoReportRequest } from './evangelismo.types';

class EvangelismoController {
  // ===== Líderes de Evangelismo =====
  
  async findAllLeaders(req: Request, res: Response) {
    try {
      const page = parseInt((req.query.page as string) || '1');
      const limit = parseInt((req.query.limit as string) || '10');
      
      const result = await evangelismoService.findAllLeaders(page, limit);
      res.json(result);
    } catch (error) {
      console.error('Erro ao buscar líderes de evangelismo:', error);
      res.status(500).json({ message: 'Erro ao buscar líderes de evangelismo' });
    }
  }

  async findLeaderById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      const leader = await evangelismoService.findLeaderById(id);
      
      if (!leader) {
        return res.status(404).json({ message: 'Líder de evangelismo não encontrado' });
      }
      
      res.json(leader);
    } catch (error) {
      console.error('Erro ao buscar líder:', error);
      res.status(500).json({ message: 'Erro ao buscar líder de evangelismo' });
    }
  }

  async createLeader(req: Request, res: Response) {
    try {
      const data: CreateEvangelismoLeaderRequest = req.body;
      
      if (!data.member_id || isNaN(data.member_id)) {
        return res.status(400).json({ message: 'member_id é obrigatório e deve ser um número válido' });
      }
      
      const id = await evangelismoService.createLeader(data);
      const leader = await evangelismoService.findLeaderById(id);
      
      res.status(201).json(leader);
    } catch (error: any) {
      console.error('Erro ao criar líder de evangelismo:', error);
      
      if (error.message === 'Membro não encontrado') {
        return res.status(404).json({ message: error.message });
      }
      
      if (error.message === 'Este membro já é um líder de evangelismo') {
        return res.status(409).json({ message: error.message });
      }
      
      res.status(500).json({ message: 'Erro ao criar líder de evangelismo' });
    }
  }

  async updateLeader(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const data: UpdateEvangelismoLeaderRequest = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      if (!data.member_id || isNaN(data.member_id)) {
        return res.status(400).json({ message: 'member_id é obrigatório e deve ser um número válido' });
      }
      
      await evangelismoService.updateLeader(id, data);
      const leader = await evangelismoService.findLeaderById(id);
      
      res.json(leader);
    } catch (error: any) {
      console.error('Erro ao atualizar líder de evangelismo:', error);
      
      if (error.message === 'Líder de evangelismo não encontrado') {
        return res.status(404).json({ message: error.message });
      }
      
      if (error.message === 'Membro não encontrado') {
        return res.status(404).json({ message: error.message });
      }
      
      if (error.message === 'Este membro já é um líder de evangelismo') {
        return res.status(409).json({ message: error.message });
      }
      
      res.status(500).json({ message: 'Erro ao atualizar líder de evangelismo' });
    }
  }

  async deleteLeader(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      await evangelismoService.deleteLeader(id);
      
      res.status(204).send();
    } catch (error: any) {
      console.error('Erro ao excluir líder de evangelismo:', error);
      
      if (error.message === 'Líder de evangelismo não encontrado') {
        return res.status(404).json({ message: error.message });
      }
      
      res.status(500).json({ message: 'Erro ao excluir líder de evangelismo' });
    }
  }

  async getStatistics(req: Request, res: Response) {
    try {
      const statistics = await evangelismoService.getStatistics();
      res.json(statistics);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({ message: 'Erro ao buscar estatísticas' });
    }
  }

  async searchMembers(req: Request, res: Response) {
    try {
      const query = req.query.query as string || '';
      
      const members = await evangelismoService.searchMembers(query);
      res.json(members);
    } catch (error) {
      console.error('Erro ao buscar membros:', error);
      res.status(500).json({ message: 'Erro ao buscar membros' });
    }
  }

  // ===== Casas de Paz =====
  
  async findAllCasasDePaz(req: Request, res: Response) {
    try {
      const casas = await evangelismoService.findAllCasasDePaz();
      res.json(casas);
    } catch (error) {
      console.error('Erro ao buscar Casas de Paz:', error);
      res.status(500).json({ error: 'Erro ao buscar Casas de Paz' });
    }
  }

  async findCasaDePazById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      const casa = await evangelismoService.findCasaDePazById(id);
      
      if (!casa) {
        return res.status(404).json({ message: 'Casa de Paz não encontrada' });
      }
      
      res.json(casa);
    } catch (error) {
      console.error('Erro ao buscar Casa de Paz:', error);
      res.status(500).json({ message: 'Erro ao buscar Casa de Paz' });
    }
  }

  async createCasaDePaz(req: Request, res: Response) {
    try {
      const data: CreateCasaDePazRequest = req.body;
      
      // Validações básicas
      if (!data.name || !data.name.trim()) {
        return res.status(400).json({ error: 'Nome da Casa de Paz é obrigatório' });
      }
      
      if (!data.responsible_id || isNaN(data.responsible_id)) {
        return res.status(400).json({ error: 'Responsável é obrigatório' });
      }
      
      if (!data.cep || !data.cep.trim()) {
        return res.status(400).json({ error: 'CEP é obrigatório' });
      }
      
      if (!data.host_name || !data.host_name.trim()) {
        return res.status(400).json({ error: 'Nome do anfitrião é obrigatório' });
      }
      
      if (!data.host_age || isNaN(data.host_age) || data.host_age <= 0) {
        return res.status(400).json({ error: 'Idade do anfitrião é obrigatória e deve ser maior que zero' });
      }
      
      if (!data.meeting_days || !Array.isArray(data.meeting_days) || data.meeting_days.length === 0) {
        return res.status(400).json({ error: 'Selecione pelo menos um dia de reunião' });
      }
      
      const casaId = await evangelismoService.createCasaDePaz(data);
      const casa = await evangelismoService.findCasaDePazById(casaId);
      
      res.status(201).json(casa);
    } catch (error: any) {
      console.error('Erro ao criar Casa de Paz:', error);
      
      if (error.message === 'Responsável não encontrado') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Erro ao criar Casa de Paz' });
    }
  }

  // ===== Relatórios de Evangelismo =====
  
  async findAllReports(req: Request, res: Response) {
    try {
      const page = parseInt((req.query.page as string) || '1');
      const limit = parseInt((req.query.limit as string) || '10');
      
      const result = await evangelismoService.findAllReports(page, limit);
      res.json(result);
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
      res.status(500).json({ message: 'Erro ao buscar relatórios' });
    }
  }

  async findReportById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      const report = await evangelismoService.findReportById(id);
      
      if (!report) {
        return res.status(404).json({ message: 'Relatório não encontrado' });
      }
      
      res.json(report);
    } catch (error) {
      console.error('Erro ao buscar relatório:', error);
      res.status(500).json({ message: 'Erro ao buscar relatório' });
    }
  }

  async createReport(req: Request, res: Response) {
    try {
      const data: CreateEvangelismoReportRequest = req.body;
      
      if (!data.casa_de_paz_id || isNaN(data.casa_de_paz_id)) {
        return res.status(400).json({ message: 'casa_de_paz_id é obrigatório' });
      }
      
      if (!data.cult_date) {
        return res.status(400).json({ message: 'Data do culto é obrigatória' });
      }
      
      if (!data.responsavel || !data.responsavel.trim()) {
        return res.status(400).json({ message: 'Responsável é obrigatório' });
      }
      
      const id = await evangelismoService.createReport(data);
      const report = await evangelismoService.findReportById(id);
      
      res.status(201).json(report);
    } catch (error: any) {
      console.error('Erro ao criar relatório:', error);
      
      if (error.message === 'Casa de Paz não encontrada') {
        return res.status(404).json({ message: error.message });
      }
      
      res.status(500).json({ message: 'Erro ao criar relatório' });
    }
  }

  async updateReport(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const data: UpdateEvangelismoReportRequest = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      if (!data.casa_de_paz_id || isNaN(data.casa_de_paz_id)) {
        return res.status(400).json({ message: 'casa_de_paz_id é obrigatório' });
      }
      
      if (!data.cult_date) {
        return res.status(400).json({ message: 'Data do culto é obrigatória' });
      }
      
      if (!data.responsavel || !data.responsavel.trim()) {
        return res.status(400).json({ message: 'Responsável é obrigatório' });
      }
      
      await evangelismoService.updateReport(id, data);
      const report = await evangelismoService.findReportById(id);
      
      res.json(report);
    } catch (error: any) {
      console.error('Erro ao atualizar relatório:', error);
      
      if (error.message === 'Relatório não encontrado' || error.message === 'Casa de Paz não encontrada') {
        return res.status(404).json({ message: error.message });
      }
      
      res.status(500).json({ message: 'Erro ao atualizar relatório' });
    }
  }

  async deleteReport(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      await evangelismoService.deleteReport(id);
      
      res.status(204).send();
    } catch (error: any) {
      console.error('Erro ao excluir relatório:', error);
      
      if (error.message === 'Relatório não encontrado') {
        return res.status(404).json({ message: error.message });
      }
      
      res.status(500).json({ message: 'Erro ao excluir relatório' });
    }
  }
}

export default new EvangelismoController();
