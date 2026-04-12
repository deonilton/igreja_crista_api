// Auth Controller - Handlers das rotas
import { Request, Response } from 'express';
import authService from './auth.service';
import { LoginRequest, AuthRequest, ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest } from './auth.types';

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const data: LoginRequest = req.body;
      
      if (!data.email || !data.password) {
        res.status(400).json({ error: 'Email e senha são obrigatórios.' });
        return;
      }

      const result = await authService.login(data);
      res.json(result);
    } catch (err: any) {
      if (err.message === 'Credenciais inválidas.') {
        res.status(401).json({ error: 'Credenciais inválidas.' });
      } else {
        console.error('Erro no login:', err);
        res.status(500).json({ error: 'Ocorreu um erro ao tentar fazer login. Por favor, tente novamente mais tarde.' });
      }
    }
  }

  async getMe(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await authService.getMe(req.userId!);
      res.json({ user });
    } catch (err: any) {
      if (err.message === 'Usuário não encontrado.') {
        res.status(404).json({ error: err.message });
      } else {
        console.error('Erro ao buscar usuário:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
      }
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const data: ForgotPasswordRequest = req.body;
      
      if (!data.email) {
        res.status(400).json({ error: 'Email é obrigatório.' });
        return;
      }

      await authService.forgotPassword(data);
      
      res.json({ 
        message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.' 
      });
    } catch (err: any) {
      console.error('Erro no forgot password:', err);
      res.status(500).json({ 
        error: 'Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.' 
      });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const data: ResetPasswordRequest = req.body;
      
      if (!data.token || !data.newPassword) {
        res.status(400).json({ error: 'Token e nova senha são obrigatórios.' });
        return;
      }

      if (data.newPassword.length < 6) {
        res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
        return;
      }

      await authService.resetPassword(data);
      
      res.json({ 
        message: 'Senha redefinida com sucesso! Você já pode fazer login com sua nova senha.' 
      });
    } catch (err: any) {
      console.error('Erro no reset password:', err);
      if (err.message.includes('inválido') || err.message.includes('expirou')) {
        res.status(400).json({ error: err.message });
      } else {
        res.status(500).json({ 
          error: 'Ocorreu um erro ao redefinir sua senha. Tente novamente mais tarde.' 
        });
      }
    }
  }

  async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data: ChangePasswordRequest = req.body;

      // Validações básicas
      if (!data.currentPassword || !data.newPassword || !data.confirmNewPassword) {
        res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
        return;
      }

      if (data.newPassword.length < 6) {
        res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
        return;
      }

      await authService.changePassword(req.userId!, data);

      res.json({ message: 'Senha alterada com sucesso!' });
    } catch (err: any) {
      console.error('Erro ao alterar senha:', err);

      if (err.message === 'Senha atual incorreta.') {
        res.status(401).json({ error: err.message });
      } else if (err.message === 'A nova senha e a confirmação não coincidem.') {
        res.status(400).json({ error: err.message });
      } else if (err.message === 'A nova senha deve ter pelo menos 6 caracteres.') {
        res.status(400).json({ error: err.message });
      } else if (err.message === 'A nova senha deve ser diferente da senha atual.') {
        res.status(400).json({ error: err.message });
      } else if (err.message === 'Usuário não encontrado.') {
        res.status(404).json({ error: err.message });
      } else {
        res.status(500).json({ error: 'Ocorreu um erro ao alterar a senha. Tente novamente mais tarde.' });
      }
    }
  }
}

export default new AuthController();
