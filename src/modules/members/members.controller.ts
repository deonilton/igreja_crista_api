// Members Controller
import { Request, Response } from 'express';
import membersService from './members.service';
import { CreateMemberRequest, UpdateMemberRequest } from './members.types';

export class MembersController {
  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const { status, search, page = '1', limit = '10' } = req.query;
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;
      
      const result = await membersService.findAll(
        status as string, 
        search as string, 
        pageNum, 
        limitNum
      );
      
      res.json(result);
    } catch (err) {
      console.error('Erro ao listar membros:', err);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      const member = await membersService.findById(id);
      
      if (!member) {
        res.status(404).json({ error: 'Membro não encontrado.' });
        return;
      }
      
      res.json({ member });
    } catch (err) {
      console.error('Erro ao buscar membro:', err);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateMemberRequest = req.body;
      
      if (!data.full_name) {
        res.status(400).json({ error: 'Nome completo é obrigatório.' });
        return;
      }

      const memberId = await membersService.create(data);
      res.status(201).json({ message: 'Membro cadastrado com sucesso!', memberId });
    } catch (err) {
      console.error('Erro ao cadastrar membro:', err);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      const data: UpdateMemberRequest = req.body;

      if (!data.full_name) {
        res.status(400).json({ error: 'Nome completo é obrigatório.' });
        return;
      }

      await membersService.update(id, data);
      res.json({ message: 'Membro atualizado com sucesso!' });
    } catch (err) {
      console.error('Erro ao atualizar membro:', err);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      await membersService.delete(id);
      res.json({ message: 'Membro excluído com sucesso!' });
    } catch (err) {
      console.error('Erro ao excluir membro:', err);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }
}

export default new MembersController();
