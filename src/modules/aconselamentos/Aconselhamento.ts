export interface Aconselhamento {
  id: number;
  pastor_id: number;
  nome_pessoa: string;
  telefone: string;
  data: string;
  horario: string;
  observacoes: string;
  status: 'agendado' | 'realizado' | 'cancelado';
  criado_em: Date;
  atualizado_em: Date;
}

export interface CreateAconselhamentoDTO {
  nome_pessoa: string;
  telefone: string;
  data: string;
  horario: string;
  observacoes?: string;
}

export interface UpdateAconselhamentoDTO {
  nome_pessoa?: string;
  telefone?: string;
  data?: string;
  horario?: string;
  observacoes?: string;
  status?: 'agendado' | 'realizado' | 'cancelado';
}
