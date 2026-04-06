import { Request, Response } from 'express';
import pastoralRoomService from './pastoral-room.service';

class PastoralRoomController {
  async getAllReportsAndOccurrences(req: Request, res: Response) {
    try {
      const data = await pastoralRoomService.getAllReportsAndOccurrences();
      res.json(data);
    } catch (error: any) {
      console.error('Erro ao buscar dados da Sala Pastoral:', error);
      res.status(500).json({ 
        error: error.message || 'Erro ao buscar dados da Sala Pastoral' 
      });
    }
  }
}

export default new PastoralRoomController();
