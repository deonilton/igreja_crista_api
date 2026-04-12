// Small Families Controller
import { Request, Response } from 'express';
import { isLeaderPortalAccessError } from '../../shared/validators/leaderPortalUserGate';
import smallFamiliesService from './small-families.service';
import { CreateSmallFamilyRequest, UpdateSmallFamilyRequest } from './small-families.types';

class SmallFamiliesController {
  async findAll(req: Request, res: Response) {
    try {
      const page = parseInt((req.query.page as string) || '1');
      const limit = parseInt((req.query.limit as string) || '10');
      
      const result = await smallFamiliesService.findAll(page, limit);
      res.json(result);
    } catch (error) {
      console.error('Erro ao buscar pequenas famílias:', error);
      res.status(500).json({ message: 'Erro ao buscar pequenas famílias' });
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const id = parseInt((req.params.id as string));
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      const family = await smallFamiliesService.findById(id);
      
      if (!family) {
        return res.status(404).json({ message: 'Líder de pequena família não encontrado' });
      }
      
      res.json(family);
    } catch (error) {
      console.error('Erro ao buscar líder:', error);
      res.status(500).json({ message: 'Erro ao buscar líder de pequena família' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data: CreateSmallFamilyRequest = req.body;
      
      if (!data.member_id || isNaN(data.member_id)) {
        return res.status(400).json({ message: 'member_id é obrigatório e deve ser um número válido' });
      }
      
      const id = await smallFamiliesService.create(data);
      const family = await smallFamiliesService.findById(id);
      
      res.status(201).json(family);
    } catch (error: any) {
      console.error('Erro ao criar líder de pequena família:', error);

      if (isLeaderPortalAccessError(error)) {
        return res.status(400).json({ message: error.message });
      }
      
      if (error.message === 'Membro não encontrado') {
        return res.status(404).json({ message: error.message });
      }
      
      if (error.message === 'Este membro já é um líder de pequena família') {
        return res.status(409).json({ message: error.message });
      }
      
      res.status(500).json({ message: 'Erro ao criar líder de pequena família' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = parseInt((req.params.id as string));
      const data: UpdateSmallFamilyRequest = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      if (!data.member_id || isNaN(data.member_id)) {
        return res.status(400).json({ message: 'member_id é obrigatório e deve ser um número válido' });
      }
      
      await smallFamiliesService.update(id, data);
      const family = await smallFamiliesService.findById(id);
      
      res.json(family);
    } catch (error: any) {
      console.error('Erro ao atualizar líder de pequena família:', error);

      if (isLeaderPortalAccessError(error)) {
        return res.status(400).json({ message: error.message });
      }
      
      if (error.message === 'Líder de pequena família não encontrado') {
        return res.status(404).json({ message: error.message });
      }
      
      if (error.message === 'Membro não encontrado') {
        return res.status(404).json({ message: error.message });
      }
      
      if (error.message === 'Este membro já é um líder de pequena família') {
        return res.status(409).json({ message: error.message });
      }
      
      res.status(500).json({ message: 'Erro ao atualizar líder de pequena família' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt((req.params.id as string));
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      await smallFamiliesService.delete(id);
      
      res.status(204).send();
    } catch (error: any) {
      console.error('Erro ao excluir líder de pequena família:', error);
      
      if (error.message === 'Líder de pequena família não encontrado') {
        return res.status(404).json({ message: error.message });
      }
      
      res.status(500).json({ message: 'Erro ao excluir líder de pequena família' });
    }
  }

  async getStatistics(req: Request, res: Response) {
    try {
      const statistics = await smallFamiliesService.getStatistics();
      res.json(statistics);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({ message: 'Erro ao buscar estatísticas' });
    }
  }

  async searchMembers(req: Request, res: Response) {
    try {
      const query = req.query.query as string || '';
      
      const members = await smallFamiliesService.searchMembers(query);
      res.json(members);
    } catch (error) {
      console.error('Erro ao buscar membros:', error);
      res.status(500).json({ message: 'Erro ao buscar membros' });
    }
  }

  async getAllFullFamilies(req: Request, res: Response) {
    try {
      const families = await smallFamiliesService.findAllFullFamilies();
      res.json(families);
    } catch (error) {
      console.error('Erro ao buscar Pequenas Famílias:', error);
      res.status(500).json({ error: 'Erro ao buscar Pequenas Famílias' });
    }
  }

  async deleteFullFamily(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string, 10);

      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }

      await smallFamiliesService.deleteFullFamily(id);

      res.status(204).send();
    } catch (error: any) {
      console.error('Erro ao excluir Pequena Família:', error);

      if (error.message === 'Pequena Família não encontrada') {
        return res.status(404).json({ message: error.message });
      }

      res.status(500).json({ message: 'Erro ao excluir Pequena Família' });
    }
  }

  async createFullFamily(req: Request, res: Response) {
    try {
      const data = req.body;
      
      // Validações básicas
      if (!data.name || !data.name.trim()) {
        return res.status(400).json({ error: 'Nome da Pequena Família é obrigatório' });
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
      
      const familyId = await smallFamiliesService.createFullFamily(data);
      
      res.status(201).json({ 
        message: 'Pequena Família criada com sucesso!',
        id: familyId 
      });
    } catch (error: any) {
      console.error('Erro ao criar Pequena Família:', error);
      
      if (error.message === 'Responsável não encontrado') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Erro ao criar Pequena Família' });
    }
  }
}

export default new SmallFamiliesController();
