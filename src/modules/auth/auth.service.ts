// Auth Service - Regras de negócio de autenticação
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../../shared/database/connection';
import { LoginRequest, LoginResponse, AuthUser, ForgotPasswordRequest, ResetPasswordRequest } from './auth.types';
import emailService from '../../shared/services/emailService';

class AuthService {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const [rows] = await pool.execute<any[]>(
      `SELECT 
        u.id, u.name, u.email, u.password, u.role_id,
        r.name as role, r.is_super_admin
       FROM users u
       INNER JOIN roles r ON u.role_id = r.id
       WHERE u.email = ?`,
      [data.email]
    );

    if (rows.length === 0) {
      throw new Error('Credenciais inválidas.');
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(data.password, user.password);
    
    if (!isMatch) {
      throw new Error('Credenciais inválidas.');
    }

    // Buscar ministérios do usuário
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

    const token = jwt.sign(
      { id: user.id, role: user.role, ministries },
      process.env.JWT_SECRET as string,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        ministries,
      },
    };
  }

  async getMe(userId: number): Promise<AuthUser> {
    const [rows] = await pool.execute<any[]>(
      `SELECT 
        u.id, u.name, u.email, u.role_id,
        r.name as role, r.is_super_admin
       FROM users u
       INNER JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      throw new Error('Usuário não encontrado.');
    }

    const user = rows[0];
    
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
    };
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    const [rows] = await pool.execute<any[]>(
      `SELECT id, name, email FROM users WHERE email = ?`,
      [data.email]
    );

    if (rows.length === 0) {
      // Não revelamos se o email existe ou não por segurança
      return;
    }

    const user = rows[0];
    
    // Limpar tokens anteriores deste usuário
    await pool.execute(
      `DELETE FROM password_reset_tokens WHERE user_id = ?`,
      [user.id]
    );

    // Gerar token seguro
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Salvar token no banco
    await pool.execute(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)`,
      [user.id, hashedToken, expiresAt]
    );

    // Enviar email
    await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);
  }

  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    // Hash do token para comparar com banco
    const hashedToken = crypto.createHash('sha256').update(data.token).digest('hex');

    // Buscar token válido
    const [tokenRows] = await pool.execute<any[]>(
      `SELECT prt.user_id, prt.expires_at, u.name, u.email 
       FROM password_reset_tokens prt
       INNER JOIN users u ON prt.user_id = u.id
       WHERE prt.token = ? AND prt.used = FALSE`,
      [hashedToken]
    );

    if (tokenRows.length === 0) {
      throw new Error('Token inválido ou já utilizado.');
    }

    const tokenData = tokenRows[0];
    
    // Verificar se token não expirou
    if (new Date() > new Date(tokenData.expires_at)) {
      throw new Error('Token expirado. Solicite uma nova recuperação de senha.');
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    // Atualizar senha
    await pool.execute(
      `UPDATE users SET password = ? WHERE id = ?`,
      [hashedPassword, tokenData.user_id]
    );

    // Marcar token como usado
    await pool.execute(
      `UPDATE password_reset_tokens SET used = TRUE WHERE token = ?`,
      [hashedToken]
    );

    // Enviar notificação
    await emailService.sendPasswordChangedNotification(tokenData.email, tokenData.name);
  }
}

export default new AuthService();
