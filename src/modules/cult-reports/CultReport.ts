export interface CultReport {
  id: number;
  cult_type_familia: boolean;
  cult_type_oracao: boolean;
  cult_type_adolescentes: boolean;
  cult_type_outros: boolean;
  cult_type_outros_texto: string;
  cult_date: string;
  horario_inicio: string;
  horario_termino: string;
  ministro: string;
  igreja: string;
  assunto: string;
  texto: string;
  lideranca: { ministerio: string; lideres: string }[];
  freq_adultos: number;
  freq_criancas: number;
  freq_adolescentes: number;
  freq_visitantes: number;
  freq_total: number;
  diacono_responsavel: string;
  casal_recepcao_1: string;
  casal_recepcao_2: string;
  casal_santa_ceia_1: string;
  casal_santa_ceia_2: string;
  programacao: { descricao: string; horario: string }[];
  ocorrencias_gerais: string;
  responsavel: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCultReportDTO {
  cult_type_familia: boolean;
  cult_type_oracao: boolean;
  cult_type_adolescentes: boolean;
  cult_type_outros: boolean;
  cult_type_outros_texto: string;
  cult_date: string;
  horario_inicio: string;
  horario_termino: string;
  ministro: string;
  igreja: string;
  assunto: string;
  texto: string;
  lideranca: { ministerio: string; lideres: string }[];
  freq_adultos: number;
  freq_criancas: number;
  freq_adolescentes: number;
  freq_visitantes: number;
  freq_total: number;
  diacono_responsavel: string;
  casal_recepcao_1: string;
  casal_recepcao_2: string;
  casal_santa_ceia_1: string;
  casal_santa_ceia_2: string;
  programacao: { descricao: string; horario: string }[];
  ocorrencias_gerais: string;
  responsavel: string;
}

export interface UpdateCultReportDTO {
  cult_type_familia?: boolean;
  cult_type_oracao?: boolean;
  cult_type_adolescentes?: boolean;
  cult_type_outros?: boolean;
  cult_type_outros_texto?: string;
  cult_date?: string;
  horario_inicio?: string;
  horario_termino?: string;
  ministro?: string;
  igreja?: string;
  assunto?: string;
  texto?: string;
  lideranca?: { ministerio: string; lideres: string }[];
  freq_adultos?: number;
  freq_criancas?: number;
  freq_adolescentes?: number;
  freq_visitantes?: number;
  freq_total?: number;
  diacono_responsavel?: string;
  casal_recepcao_1?: string;
  casal_recepcao_2?: string;
  casal_santa_ceia_1?: string;
  casal_santa_ceia_2?: string;
  programacao?: { descricao: string; horario: string }[];
  ocorrencias_gerais?: string;
  responsavel?: string;
}
