import { Request } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Extend Express Request to include auth properties
export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
  userMinistries?: string[];
}

// JWT payload
export interface JwtPayload {
  id: number;
  role: string;
  ministries?: string[];
  iat?: number;
  exp?: number;
}

// Database row types
export interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'super_admin' | 'admin' | 'colaborador';
  ministries: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface MemberRow extends RowDataPacket {
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  birth_date: Date | null;
  gender: 'M' | 'F' | 'Outro' | null;
  address: string | null;
  house_number: string | null;
  complement: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  baptism_date: Date | null;
  membership_date: Date | null;
  status: 'Ativo' | 'Inativo' | 'Visitante';
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CountRow extends RowDataPacket {
  total: number;
}

export interface GenderRow extends RowDataPacket {
  gender: string;
  total: number;
}

export { ResultSetHeader };
