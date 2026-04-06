// Users Service - Regras de negócio de usuários
import bcrypt from 'bcryptjs';
import pool from '../../shared/database/connection';
import { User, CreateUserRequest, UpdateUserRequest } from './users.types';

class UsersService {
  async findAll(): Promise<User[]> {
    const [rows] = await pool.execute<any[]>(
      `SELECT 
        u.id, u.name, u.email, u.role_id, u.created_at,
        r.name as role, r.is_super_admin
       FROM users u
       INNER JOIN roles r ON u.role_id = r.id
       ORDER BY u.created_at DESC`
    );

    const usersWithMinistries = await Promise.all(
      rows.map(async (user) => {
        let ministries: string[] = [];
        
        if (!user.is_super_admin) {
          const [ministryRows] = await pool.execute<any[]>(
            `SELECT m.name 
             FROM user_ministries um
             INNER JOIN ministries m ON um.ministry_id = m.id
             WHERE um.user_id = ? AND m.is_active = 1`,
            [user.id]
          );
          ministries = ministryRows.map((row: any) => row.name);
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          ministries,
          created_at: user.created_at
        };
      })
    );

    return usersWithMinistries;
  }

  async create(data: CreateUserRequest): Promise<number> {
    // Verificar email duplicado
    const [existing] = await pool.execute<any[]>(
      'SELECT id FROM users WHERE email = ?',
      [data.email]
    );

    if (existing.length > 0) {
      throw new Error('Este email já está cadastrado.');
    }

    // Buscar role_id
    const [roleRows] = await pool.execute<any[]>(
      'SELECT id FROM roles WHERE name = ?',
      [data.role || 'colaborador']
    );

    if (roleRows.length === 0) {
      throw new Error('Role inválida.');
    }

    const roleId = roleRows[0].id;
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const [result] = await pool.execute<any>(
      'INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)',
      [data.name, data.email, hashedPassword, roleId]
    );

    const userId = result.insertId;

    // Inserir ministérios
    if (data.ministries && data.ministries.length > 0) {
      for (const ministryName of data.ministries) {
        const [ministryRows] = await pool.execute<any[]>(
          'SELECT id FROM ministries WHERE name = ?',
          [ministryName]
        );
        
        if (ministryRows.length > 0) {
          await pool.execute(
            'INSERT INTO user_ministries (user_id, ministry_id) VALUES (?, ?)',
            [userId, ministryRows[0].id]
          );
        }
      }
    }

    return userId;
  }

  async update(id: number, data: UpdateUserRequest): Promise<void> {
    // Verificar se usuário existe
    const [existing] = await pool.execute<any[]>(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      throw new Error('Usuário não encontrado.');
    }

    // Verificar email duplicado
    const [emailCheck] = await pool.execute<any[]>(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [data.email, id]
    );

    if (emailCheck.length > 0) {
      throw new Error('Este email já está em uso.');
    }

    // Buscar role_id
    const [roleRows] = await pool.execute<any[]>(
      'SELECT id FROM roles WHERE name = ?',
      [data.role || 'colaborador']
    );

    if (roleRows.length === 0) {
      throw new Error('Role inválida.');
    }

    const roleId = roleRows[0].id;

    // Atualizar usuário
    if (data.password && data.password.length >= 6) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      await pool.execute(
        'UPDATE users SET name = ?, email = ?, password = ?, role_id = ? WHERE id = ?',
        [data.name, data.email, hashedPassword, roleId, id]
      );
    } else {
      await pool.execute(
        'UPDATE users SET name = ?, email = ?, role_id = ? WHERE id = ?',
        [data.name, data.email, roleId, id]
      );
    }

    // Atualizar ministérios
    await pool.execute('DELETE FROM user_ministries WHERE user_id = ?', [id]);

    if (data.ministries && data.ministries.length > 0) {
      for (const ministryName of data.ministries) {
        const [ministryRows] = await pool.execute<any[]>(
          'SELECT id FROM ministries WHERE name = ?',
          [ministryName]
        );
        
        if (ministryRows.length > 0) {
          await pool.execute(
            'INSERT INTO user_ministries (user_id, ministry_id) VALUES (?, ?)',
            [id, ministryRows[0].id]
          );
        }
      }
    }
  }

  async delete(id: number, currentUserId: number): Promise<void> {
    if (id === currentUserId) {
      throw new Error('Não é possível excluir o próprio usuário.');
    }

    const [existing] = await pool.execute<any[]>(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      throw new Error('Usuário não encontrado.');
    }

    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
  }
}

export default new UsersService();
