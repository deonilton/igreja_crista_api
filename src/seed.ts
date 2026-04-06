import bcrypt from 'bcryptjs';
import pool from './config/database';
import { UserRow } from './types';

async function seedAdmin(): Promise<void> {
  try {
    const [rows] = await pool.execute<UserRow[]>('SELECT id FROM users LIMIT 1');

    if (rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);

      await pool.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Administrador', 'admin@igreja.com', hashedPassword, 'admin']
      );

      console.log('✅ Usuário admin criado: admin@igreja.com / admin123');
    }
  } catch (err) {
    // Tabela pode não existir ainda, não queremos crashar
    console.log('⚠️  Seed ignorado (tabela users pode não existir ainda).');
  }
}

export default seedAdmin;
