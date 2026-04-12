// Deacons Controller
import { Request, Response } from 'express';
import { isLeaderPortalAccessError } from '../../shared/validators/leaderPortalUserGate';
import deaconsService from './deacons.service';
import { CreateDeaconRequest, UpdateDeaconRequest } from './deacons.types';

class DeaconsController {
  async findAll(req: Request, res: Response) {
    try {
      const page = parseInt((req.query.page as string) || '1');
      const limit = parseInt((req.query.limit as string) || '10');
      
      const result = await deaconsService.findAll(page, limit);
      res.json(result);
    } catch (error) {
      console.error('Erro ao buscar diáconos:', error);
      res.status(500).json({ message: 'Erro ao buscar diáconos' });
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const id = parseInt((req.params.id as string));
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      const deacon = await deaconsService.findById(id);
      
      if (!deacon) {
        return res.status(404).json({ message: 'Diácono não encontrado' });
      }
      
      res.json(deacon);
    } catch (error) {
      console.error('Erro ao buscar diácono:', error);
      res.status(500).json({ message: 'Erro ao buscar diácono' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data: CreateDeaconRequest = req.body;
      
      // Validação básica
      if (!data.member_id || isNaN(data.member_id)) {
        return res.status(400).json({ message: 'member_id é obrigatório e deve ser um número válido' });
      }
      
      const id = await deaconsService.create(data);
      const deacon = await deaconsService.findById(id);
      
      res.status(201).json(deacon);
    } catch (error: any) {
      console.error('Erro ao criar diácono:', error);

      if (isLeaderPortalAccessError(error)) {
        return res.status(400).json({ message: error.message });
      }
      
      if (error.message === 'Membro não encontrado') {
        return res.status(404).json({ message: error.message });
      }
      
      if (error.message === 'Este membro já é um diácono') {
        return res.status(409).json({ message: error.message });
      }
      
      res.status(500).json({ message: 'Erro ao criar diácono' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = parseInt((req.params.id as string));
      const data: UpdateDeaconRequest = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      if (!data.member_id || isNaN(data.member_id)) {
        return res.status(400).json({ message: 'member_id é obrigatório e deve ser um número válido' });
      }
      
      await deaconsService.update(id, data);
      const deacon = await deaconsService.findById(id);
      
      res.json(deacon);
    } catch (error: any) {
      console.error('Erro ao atualizar diácono:', error);

      if (isLeaderPortalAccessError(error)) {
        return res.status(400).json({ message: error.message });
      }
      
      if (error.message === 'Diácono não encontrado') {
        return res.status(404).json({ message: error.message });
      }
      
      if (error.message === 'Membro não encontrado') {
        return res.status(404).json({ message: error.message });
      }
      
      if (error.message === 'Este membro já é um diácono') {
        return res.status(409).json({ message: error.message });
      }
      
      res.status(500).json({ message: 'Erro ao atualizar diácono' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt((req.params.id as string));
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      
      await deaconsService.delete(id);
      
      res.status(204).send();
    } catch (error: any) {
      console.error('Erro ao excluir diácono:', error);
      
      if (error.message === 'Diácono não encontrado') {
        return res.status(404).json({ message: error.message });
      }
      
      res.status(500).json({ message: 'Erro ao excluir diácono' });
    }
  }

  async getStatistics(req: Request, res: Response) {
    try {
      const statistics = await deaconsService.getStatistics();
      res.json(statistics);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({ message: 'Erro ao buscar estatísticas' });
    }
  }

  async searchMembers(req: Request, res: Response) {
    try {
      const query = req.query.query as string || '';
      
      const members = await deaconsService.searchMembers(query);
      res.json(members);
    } catch (error) {
      console.error('Erro ao buscar membros:', error);
      res.status(500).json({ message: 'Erro ao buscar membros' });
    }
  }
}

export default new DeaconsController();
