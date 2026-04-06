// Public Controller
import { Request, Response } from 'express';
import publicService from './public.service';
import { PublicMemberRequest } from './public.types';

export class PublicController {
  async registerMember(req: Request, res: Response): Promise<void> {
    try {
      const data: PublicMemberRequest = req.body;
      
      if (!data.full_name) {
        res.status(400).json({ error: 'Nome completo é obrigatório.' });
        return;
      }

      const memberId = await publicService.registerMember(data);
      res.status(201).json({ 
        message: 'Cadastro realizado com sucesso!',
        memberId 
      });
    } catch (err) {
      console.error('Erro ao cadastrar visitante:', err);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }
}

export default new PublicController();
