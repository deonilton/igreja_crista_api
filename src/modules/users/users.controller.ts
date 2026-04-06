// Users Controller
import { Request, Response } from 'express';
import usersService from './users.service';
import { CreateUserRequest, UpdateUserRequest } from './users.types';
import { AuthRequest } from '../../shared/middlewares/auth.middleware';

export class UsersController {
  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const users = await usersService.findAll();
      res.json({ users });
    } catch (err) {
      console.error('Erro ao listar usuários:', err);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateUserRequest = req.body;
      
      if (!data.name || !data.email || !data.password) {
        res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
        return;
      }

      if (data.password.length < 6) {
        res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });
        return;
      }

      const userId = await usersService.create(data);
      res.status(201).json({ message: 'Usuário cadastrado com sucesso!', userId });
    } catch (err: any) {
      if (err.message === 'Este email já está cadastrado.' || 
          err.message === 'Role inválida.') {
        res.status(400).json({ error: err.message });
      } else {
        console.error('Erro ao cadastrar usuário:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
      }
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      const data: UpdateUserRequest = req.body;

      if (!data.name || !data.email) {
        res.status(400).json({ error: 'Nome e email são obrigatórios.' });
        return;
      }

      await usersService.update(id, data);
      res.json({ message: 'Usuário atualizado com sucesso!' });
    } catch (err: any) {
      if (err.message === 'Usuário não encontrado.' ||
          err.message === 'Este email já está em uso.' ||
          err.message === 'Role inválida.') {
        res.status(400).json({ error: err.message });
      } else {
        console.error('Erro ao atualizar usuário:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
      }
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      await usersService.delete(id, req.userId!);
      res.json({ message: 'Usuário excluído com sucesso!' });
    } catch (err: any) {
      if (err.message === 'Não é possível excluir o próprio usuário.' ||
          err.message === 'Usuário não encontrado.') {
        res.status(400).json({ error: err.message });
      } else {
        console.error('Erro ao excluir usuário:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
      }
    }
  }
}

export default new UsersController();
