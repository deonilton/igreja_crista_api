import pool from '../../shared/database/connection';

interface SmallFamilyReport {
  id: number;
  family_id: number;
  family_name: string;
  cult_date: string;
  responsavel: string;
  endereco: string;
  bairro: string;
  participantes: string;
  offering_amount: number;
  observacoes: string;
  created_at: string;
  type: 'small_family';
}

interface Occurrence {
  id: number;
  date: string;
  reporter_name: string;
  witnesses: string | null;
  location: string;
  description: string;
  created_at: string;
  type: 'occurrence';
}

interface EvangelismoReportPastoral {
  id: number;
  casa_de_paz_id: number;
  casa_name: string;
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
}

interface PastoralRoomData {
  /** Linhas completas de cult_reports (mesmo formato de GET /cult-reports). */
  cultReports: Record<string, unknown>[];
  smallFamilyReports: SmallFamilyReport[];
  occurrences: Occurrence[];
  evangelismoReports: EvangelismoReportPastoral[];
}

/** DATE do MySQL → YYYY-MM-DD (usa componentes UTC; evita deslocar o dia civil). */
function sqlDateOnlyToYmd(value: unknown): string {
  if (value == null || value === '') return '';
  if (typeof value === 'string') {
    const m = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim());
    if (m) return m[1];
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getUTCFullYear();
    const mo = String(value.getUTCMonth() + 1).padStart(2, '0');
    const d = String(value.getUTCDate()).padStart(2, '0');
    return `${y}-${mo}-${d}`;
  }
  const s = String(value).split('T')[0];
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
}

function toIsoDateString(value: unknown): string {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return String(value);
}

class PastoralRoomService {
  async getAllReportsAndOccurrences(): Promise<PastoralRoomData> {
    try {
      // Relatórios de culto (campos completos para o modal na Sala Pastoral)
      const [cultReportsRows] = await pool.execute<any[]>(
        `SELECT * FROM cult_reports
         ORDER BY cult_date DESC, created_at DESC
         LIMIT 50`
      );

      const cultReports: Record<string, unknown>[] = cultReportsRows.map((row) => {
        const { ...rest } = row;
        if (rest.cult_date != null) {
          rest.cult_date = sqlDateOnlyToYmd(rest.cult_date);
        }
        return rest as Record<string, unknown>;
      });

      // Buscar relatórios de pequenas famílias
      const [smallFamilyReportsRows] = await pool.execute<any[]>(
        `SELECT 
          sfr.id,
          sfr.family_id,
          sfd.name as family_name,
          sfr.cult_date,
          sfr.responsavel,
          sfr.endereco,
          sfr.bairro,
          sfr.participantes,
          sfr.offering_amount,
          sfr.observacoes,
          sfr.created_at
         FROM small_family_reports sfr
         LEFT JOIN small_family_details sfd ON sfr.family_id = sfd.id
         ORDER BY sfr.cult_date DESC, sfr.created_at DESC
         LIMIT 50`
      );

      const smallFamilyReports: SmallFamilyReport[] = smallFamilyReportsRows.map(row => ({
        id: row.id,
        family_id: row.family_id,
        family_name: row.family_name || 'Família não identificada',
        cult_date: sqlDateOnlyToYmd(row.cult_date),
        responsavel: row.responsavel,
        endereco: row.endereco,
        bairro: row.bairro,
        participantes: row.participantes,
        offering_amount: row.offering_amount,
        observacoes: row.observacoes,
        created_at: toIsoDateString(row.created_at),
        type: 'small_family' as const
      }));

      // Buscar ocorrências
      const [occurrencesRows] = await pool.execute<any[]>(
        `SELECT 
          id,
          date,
          reporter_name,
          witnesses,
          location,
          description,
          created_at
         FROM occurrences
         ORDER BY date DESC, created_at DESC
         LIMIT 50`
      );

      const occurrences: Occurrence[] = occurrencesRows.map(row => ({
        id: row.id,
        date: sqlDateOnlyToYmd(row.date),
        reporter_name: row.reporter_name,
        witnesses: row.witnesses,
        location: row.location,
        description: row.description,
        created_at: toIsoDateString(row.created_at),
        type: 'occurrence' as const
      }));

      const [evangelismoRows] = await pool.execute<any[]>(
        `SELECT 
          er.id,
          er.casa_de_paz_id,
          er.cult_date,
          er.horario_inicio,
          er.horario_termino,
          er.responsavel,
          er.endereco,
          er.bairro,
          er.participantes,
          er.new_visitors,
          er.conversions,
          er.offeringAmount,
          er.observacoes,
          er.created_at,
          er.updated_at,
          cdp.name as casa_name
         FROM evangelismo_reports er
         INNER JOIN casas_de_paz cdp ON er.casa_de_paz_id = cdp.id
         ORDER BY er.cult_date DESC, er.created_at DESC
         LIMIT 50`
      );

      const evangelismoReports: EvangelismoReportPastoral[] = evangelismoRows.map((row) => ({
        id: row.id,
        casa_de_paz_id: row.casa_de_paz_id,
        casa_name: row.casa_name || 'Casa de Paz',
        cult_date: sqlDateOnlyToYmd(row.cult_date),
        horario_inicio: row.horario_inicio ?? null,
        horario_termino: row.horario_termino ?? null,
        responsavel: row.responsavel ?? '',
        endereco: row.endereco ?? null,
        bairro: row.bairro ?? null,
        participantes: row.participantes ?? null,
        new_visitors: row.new_visitors ?? 0,
        conversions: row.conversions ?? 0,
        offeringAmount: row.offeringAmount ?? 0,
        observacoes: row.observacoes ?? null,
        created_at: toIsoDateString(row.created_at),
      }));

      return {
        cultReports,
        smallFamilyReports,
        occurrences,
        evangelismoReports,
      };
    } catch (error: any) {
      console.error('Erro ao buscar dados da Sala Pastoral:', error);
      throw new Error(`Erro ao buscar dados da Sala Pastoral: ${error.message}`);
    }
  }
}

export default new PastoralRoomService();
