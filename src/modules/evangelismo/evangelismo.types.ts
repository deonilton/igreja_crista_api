export interface EvangelismoLeader {
  id: number;
  member_id: number;
  created_at: string;
  updated_at: string;
  member?: {
    id: number;
    full_name: string;
    email: string | null;
    phone: string | null;
  };
}

export interface EvangelismoLeadersResponse {
  casas: EvangelismoLeader[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateEvangelismoLeaderRequest {
  member_id: number;
}

export interface UpdateEvangelismoLeaderRequest {
  member_id: number;
}

export interface MemberSearchResult {
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
}

export interface CasaDePaz {
  id: number;
  name: string;
  responsible_id: number;
  cep: string;
  street: string | null;
  number: string;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  host_name: string;
  host_age: number;
  is_converted: boolean;
  has_bible: boolean;
  meeting_days: string[];
  family_members: CasaDePazMember[];
  created_at: string;
  updated_at: string;
  responsible_name?: string;
}

export interface CasaDePazMember {
  id?: number;
  name: string;
  age: number;
}

export interface CreateCasaDePazRequest {
  name: string;
  responsible_id: number;
  cep: string;
  street?: string;
  number: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  host_name: string;
  host_age: number;
  is_converted?: boolean;
  has_bible?: boolean;
  meeting_days: string[];
  family_members?: CasaDePazMember[];
}

export interface EvangelismoReport {
  id: number;
  casa_de_paz_id: number;
  cult_date: string;
  horario_inicio: string | null;
  horario_termino: string | null;
  responsavel: string;
  endereco: string | null;
  bairro: string | null;
  participantes: string | null;
  new_visitors: number;
  conversions: number;
  offeringAmount: number;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  casa_de_paz?: {
    id: number;
    name: string;
  };
}

export interface CreateEvangelismoReportRequest {
  casa_de_paz_id: number;
  cult_date: string;
  horario_inicio?: string;
  horario_termino?: string;
  responsavel: string;
  endereco?: string;
  bairro?: string;
  participantes?: string;
  new_visitors?: number;
  conversions?: number;
  offeringAmount?: number;
  observacoes?: string;
}

export interface UpdateEvangelismoReportRequest {
  casa_de_paz_id: number;
  cult_date: string;
  horario_inicio?: string;
  horario_termino?: string;
  responsavel: string;
  endereco?: string;
  bairro?: string;
  participantes?: string;
  new_visitors?: number;
  conversions?: number;
  offeringAmount?: number;
  observacoes?: string;
}

export interface EvangelismoReportsResponse {
  reports: EvangelismoReport[];
  total: number;
  page: number;
  totalPages: number;
}
