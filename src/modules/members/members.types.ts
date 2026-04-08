// Members Types
export interface Member {
  id: number;
  full_name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  gender?: string;
  address?: string;
  house_number?: string;
  complement?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  baptism_date?: string;
  membership_date?: string;
  status: 'Ativo' | 'Inativo' | 'Visitante';
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateMemberRequest {
  full_name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  gender?: string;
  address?: string;
  house_number?: string;
  complement?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  baptism_date?: string;
  membership_date?: string;
  status?: string;
  notes?: string;
}

export interface UpdateMemberRequest {
  full_name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  gender?: string;
  address?: string;
  house_number?: string;
  complement?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  baptism_date?: string;
  membership_date?: string;
  status?: string;
  notes?: string;
}

export interface AgeRangeStats {
  children: number;
  teenagers: number;
  youngAdults: number;
  adults: number;
  elderly: number;
}
