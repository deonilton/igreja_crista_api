// Members Service
import pool from '../../shared/database/connection';
import { Member, CreateMemberRequest, UpdateMemberRequest } from './members.types';

function sanitizePagination(page: number, limit: number): { safePage: number; safeLimit: number; safeOffset: number } {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 10;

  return {
    safePage,
    safeLimit,
    safeOffset: (safePage - 1) * safeLimit,
  };
}

class MembersService {
  async findAll(status?: string, search?: string, page: number = 1, limit: number = 10): Promise<{ members: Member[], total: number, page: number, totalPages: number }> {
    const { safePage, safeLimit, safeOffset } = sanitizePagination(page, limit);
    
    // Query para contar total de registros
    let countQuery = 'SELECT COUNT(*) as total FROM members';
    const countParams: any[] = [];
    const countConditions: string[] = [];
    
    if (status && status !== '') {
      countConditions.push('status = ?');
      countParams.push(status);
    }
    
    if (search && search !== '') {
      countConditions.push('(full_name LIKE ? OR email LIKE ? OR phone LIKE ?)');
      const searchParam = `%${search}%`;
      countParams.push(searchParam, searchParam, searchParam);
    }
    
    if (countConditions.length > 0) {
      countQuery += ' WHERE ' + countConditions.join(' AND ');
    }
    
    const [countResult] = await pool.execute<any[]>(countQuery, countParams);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / safeLimit);
    
    // Query para buscar membros com paginação
    let query = 'SELECT * FROM members';
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (status && status !== '') {
      conditions.push('status = ?');
      params.push(status);
    }
    
    if (search && search !== '') {
      conditions.push('(full_name LIKE ? OR email LIKE ? OR phone LIKE ?)');
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY created_at DESC LIMIT ' + safeLimit + ' OFFSET ' + safeOffset;
    
    const [rows] = await pool.execute<any[]>(query, params);
    
    return {
      members: rows,
      total,
      page: safePage,
      totalPages
    };
  }

  async findById(id: number): Promise<Member | null> {
    const [rows] = await pool.execute<any[]>(
      'SELECT * FROM members WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async create(data: CreateMemberRequest): Promise<number> {
    const [result] = await pool.execute<any>(
      `INSERT INTO members 
        (full_name, email, phone, birth_date, gender, address, house_number, complement, 
         city, state, zip_code, baptism_date, membership_date, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.full_name,
        data.email || null,
        data.phone || null,
        data.birth_date || null,
        data.gender || null,
        data.address || null,
        data.house_number || null,
        data.complement || null,
        data.city || null,
        data.state || null,
        data.zip_code || null,
        data.baptism_date || null,
        data.membership_date || null,
        data.status || 'Ativo',
        data.notes || null,
      ]
    );
    return result.insertId;
  }

  async update(id: number, data: UpdateMemberRequest): Promise<void> {
    await pool.execute(
      `UPDATE members SET
        full_name = ?, email = ?, phone = ?, birth_date = ?, gender = ?,
        address = ?, house_number = ?, complement = ?, city = ?, state = ?, 
        zip_code = ?, baptism_date = ?, membership_date = ?, status = ?, notes = ?
       WHERE id = ?`,
      [
        data.full_name,
        data.email || null,
        data.phone || null,
        data.birth_date || null,
        data.gender || null,
        data.address || null,
        data.house_number || null,
        data.complement || null,
        data.city || null,
        data.state || null,
        data.zip_code || null,
        data.baptism_date || null,
        data.membership_date || null,
        data.status || 'Ativo',
        data.notes || null,
        id,
      ]
    );
  }

  async delete(id: number): Promise<void> {
    await pool.execute('DELETE FROM members WHERE id = ?', [id]);
  }
}

export default new MembersService();
