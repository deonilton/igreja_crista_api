export interface SmallFamilyReport {
  id: number;
  family_id: number;
  cult_date: string;
  horario_inicio: string;
  horario_termino: string;
  responsavel: string;
  endereco: string;
  bairro: string;
  participantes: string;
  OfferingAmount: number;
  observacoes: string;
  created_at: string;
  updated_at: string;
}

export interface SmallFamilyReportsResponse {
  reports: SmallFamilyReport[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateSmallFamilyReportRequest {
  family_id: number;
  cult_date: string;
  horario_inicio?: string;
  horario_termino?: string;
  responsavel: string;
  endereco?: string;
  bairro?: string;
  participantes?: string;
  OfferingAmount?: number;
  observacoes?: string;
}

export interface UpdateSmallFamilyReportRequest {
  family_id?: number;
  cult_date?: string;
  horario_inicio?: string;
  horario_termino?: string;
  responsavel?: string;
  endereco?: string;
  bairro?: string;
  participantes?: string;
  OfferingAmount?: number;
  observacoes?: string;
}
