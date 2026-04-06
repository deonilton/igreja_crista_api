// Public Service - Cadastro público de visitantes
import pool from '../../shared/database/connection';
import { PublicMemberRequest } from './public.types';

class PublicService {
  async registerMember(data: PublicMemberRequest): Promise<number> {
    const [result] = await pool.execute<any>(
      `INSERT INTO members 
        (full_name, email, phone, birth_date, gender, address, city, state, 
         zip_code, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Visitante', ?)`,
      [
        data.full_name,
        data.email || null,
        data.phone || null,
        data.birth_date || null,
        data.gender || null,
        data.address || null,
        data.city || null,
        data.state || null,
        data.zip_code || null,
        data.notes || null,
      ]
    );
    return result.insertId;
  }
}

export default new PublicService();
