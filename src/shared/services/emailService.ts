// Email Service - Serviço de envio de emails usando Resend
import { Resend } from 'resend';

// Inicialização lazy para evitar erro durante startup
let resendInstance: Resend | null = null;

function getResendInstance(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    console.log('🔧 Email Service: Inicializando Resend com API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NÃO DEFINIDA');
    
    if (!apiKey) {
      throw new Error('RESEND_API_KEY não está definida no ambiente');
    }
    
    resendInstance = new Resend(apiKey);
    console.log('✅ Email Service: Resend inicializado com sucesso');
  }
  return resendInstance;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  async sendPasswordResetEmail(email: string, name: string, resetToken: string): Promise<void> {
    console.log('📧 Email Service: Iniciando envio de password reset');
    console.log('📧 Email Service: Destinatário:', email);
    console.log('📧 Email Service: Nome:', name);
    console.log('📧 Email Service: Token (primeiros 10 chars):', resetToken.substring(0, 10) + '...');
    
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    console.log('📧 Email Service: Reset URL gerado:', resetUrl);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Recuperação de Senha</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              max-width: 150px;
              margin-bottom: 20px;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 10px;
              margin-bottom: 30px;
            }
            .button {
              display: inline-block;
              background: #2563eb;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .warning {
              background: #fef3c7;
              border: 1px solid #f59e0b;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Igreja Cristã Familiar</h1>
            <p>Sistema de Gestão</p>
          </div>
          
          <div class="content">
            <h2>Recuperação de Senha</h2>
            
            <p>Olá, <strong>${name}</strong>!</p>
            
            <p>Recebemos uma solicitação para redefinir sua senha. Se você não fez esta solicitação, ignore este email.</p>
            
            <p>Para redefinir sua senha, clique no botão abaixo:</p>
            
            <a href="${resetUrl}" class="button">Redefinir Senha</a>
            
            <p>Ou copie e cole este link no seu navegador:</p>
            <p>${resetUrl}</p>
            
            <div class="warning">
              <p><strong>Importante:</strong> Este link expira em 1 hora por segurança.</p>
            </div>
          </div>
          
          <div class="footer">
            <p>&copy; 2024 Igreja Cristã Familiar. Todos os direitos reservados.</p>
            <p>Este é um email automático, por favor não responda.</p>
          </div>
        </body>
      </html>
    `;

    const emailOptions: EmailOptions = {
      to: email,
      subject: 'Recuperação de Senha - Igreja Cristã Familiar',
      html: htmlContent
    };

    try {
      const resend = getResendInstance();
      console.log('📧 Email Service: Enviando email via Resend...');
      
      // IMPORTANTE: O email 'from' precisa ser um domínio verificado no Resend
      // Para testes, podemos usar 'onboarding@resend.dev' que é o domínio padrão
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      console.log('📧 Email Service: Usando from:', fromEmail);
      
      const result = await resend.emails.send({
        from: fromEmail,
        to: emailOptions.to,
        subject: emailOptions.subject,
        html: emailOptions.html
      });
      
      console.log('✅ Email Service: Email enviado com sucesso!', result);
      console.log(`📧 Email Service: Email de recuperação enviado para ${email}`);
    } catch (error) {
      console.error('❌ Email Service: Erro ao enviar email:', error);
      throw new Error('Não foi possível enviar o email de recuperação. Tente novamente mais tarde.');
    }
  }

  async sendPasswordChangedNotification(email: string, name: string): Promise<void> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Senha Alterada</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .content {
              background: #f0fdf4;
              border: 1px solid #22c55e;
              padding: 30px;
              border-radius: 10px;
              margin-bottom: 30px;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Igreja Cristã Familiar</h1>
            <p>Sistema de Gestão</p>
          </div>
          
          <div class="content">
            <h2>Senha Alterada com Sucesso</h2>
            
            <p>Olá, <strong>${name}</strong>!</p>
            
            <p>Sua senha foi alterada com sucesso em nosso sistema.</p>
            
            <p>Se você não fez esta alteração, entre em contato imediatamente com o administrador do sistema.</p>
          </div>
          
          <div class="footer">
            <p>&copy; 2024 Igreja Cristã Familiar. Todos os direitos reservados.</p>
            <p>Este é um email automático, por favor não responda.</p>
          </div>
        </body>
      </html>
    `;

    try {
      const resend = getResendInstance();
      console.log('📧 Email Service: Enviando notificação de senha alterada...');
      
      // IMPORTANTE: O email 'from' precisa ser um domínio verificado no Resend
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      console.log('📧 Email Service: Usando from:', fromEmail);
      
      const result = await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Senha Alterada - Igreja Cristã Familiar',
        html: htmlContent
      });
      
      console.log('✅ Email Service: Notificação de senha alterada enviada!', result);
    } catch (error) {
      console.error('❌ Email Service: Erro ao enviar notificação:', error);
      // Não lança erro aqui pois é apenas uma notificação
    }
  }
}

export default new EmailService();
