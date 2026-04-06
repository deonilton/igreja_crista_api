// Auth Types
import { Request } from 'express';

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
  userMinistries?: string[];
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  ministries: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface PasswordResetResponse {
  message: string;
}
