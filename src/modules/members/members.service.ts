// Members Service
import pool from '../../shared/database/connection';
import { Member, CreateMemberRequest, UpdateMemberRequest, AgeRangeStats } from './members.types';

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

  /** Retorna o id do membro que já usa este email (comparação case-insensitive), ou null. */
  async findIdByEmail(email: string, excludeMemberId?: number): Promise<number | null> {
    const trimmed = email.trim();
    if (!trimmed) return null;

    const sql =
      excludeMemberId != null
        ? `SELECT id FROM members 
           WHERE email IS NOT NULL AND LOWER(TRIM(email)) = LOWER(?) AND id != ?
           LIMIT 1`
        : `SELECT id FROM members 
           WHERE email IS NOT NULL AND LOWER(TRIM(email)) = LOWER(?)
           LIMIT 1`;
    const params: (string | number)[] =
      excludeMemberId != null ? [trimmed, excludeMemberId] : [trimmed];

    const [rows] = await pool.execute<any[]>(sql, params);
    return rows.length > 0 ? Number(rows[0].id) : null;
  }

  async create(data: CreateMemberRequest): Promise<number> {
    const email = data.email?.trim() || null;
    const [result] = await pool.execute<any>(
      `INSERT INTO members 
        (full_name, email, phone, birth_date, gender, address, house_number, complement, 
         city, state, zip_code, baptism_date, membership_date, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.full_name,
        email,
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
    const email = data.email?.trim() || null;
    await pool.execute(
      `UPDATE members SET
        full_name = ?, email = ?, phone = ?, birth_date = ?, gender = ?,
        address = ?, house_number = ?, complement = ?, city = ?, state = ?, 
        zip_code = ?, baptism_date = ?, membership_date = ?, status = ?, notes = ?
       WHERE id = ?`,
      [
        data.full_name,
        email,
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

  async getAgeRanges(): Promise<AgeRangeStats> {
    const query = `
      SELECT 
        SUM(CASE WHEN age BETWEEN 0 AND 12 THEN 1 ELSE 0 END) as children,
        SUM(CASE WHEN age BETWEEN 13 AND 17 THEN 1 ELSE 0 END) as teenagers,
        SUM(CASE WHEN age BETWEEN 18 AND 29 THEN 1 ELSE 0 END) as youngAdults,
        SUM(CASE WHEN age BETWEEN 30 AND 59 THEN 1 ELSE 0 END) as adults,
        SUM(CASE WHEN age >= 60 THEN 1 ELSE 0 END) as elderly
      FROM (
        SELECT TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) as age
        FROM members
        WHERE birth_date IS NOT NULL
      ) as ages
    `;

    const [rows] = await pool.execute<any[]>(query);
    const result = rows[0];

    return {
      children: result.children || 0,
      teenagers: result.teenagers || 0,
      youngAdults: result.youngAdults || 0,
      adults: result.adults || 0,
      elderly: result.elderly || 0,
    };
  }
}

export default new MembersService();
