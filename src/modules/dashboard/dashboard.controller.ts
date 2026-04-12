// Dashboard Controller
import { Request, Response } from 'express';
import dashboardService from './dashboard.service';
import membersService from '../members/members.service';

export class DashboardController {
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const data = await dashboardService.getDashboardData();
      res.json(data);
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }

  /** Agregado só leitura — mesma permissão do dashboard (admin, líder, etc.). */
  async getAgeRanges(req: Request, res: Response): Promise<void> {
    try {
      const stats = await membersService.getAgeRanges();
      res.json(stats);
    } catch (err) {
      console.error('Erro ao carregar faixas etárias:', err);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }
}

export default new DashboardController();
