import pool from '../../shared/database/connection';

interface CultReport {
  id: number;
  ministry_id: number;
  ministry_name: string;
  report_date: Date;
  title: string;
  description: string;
  created_at: Date;
  type: 'cult';
}

interface SmallFamilyReport {
  id: number;
  family_id: number;
  family_name: string;
  cult_date: Date;
  responsavel: string;
  endereco: string;
  bairro: string;
  participantes: string;
  offering_amount: number;
  observacoes: string;
  created_at: Date;
  type: 'small_family';
}

interface Occurrence {
  id: number;
  date: Date;
  reporter_name: string;
  witnesses: string | null;
  location: string;
  description: string;
  created_at: Date;
  type: 'occurrence';
}

interface PastoralRoomData {
  cultReports: CultReport[];
  smallFamilyReports: SmallFamilyReport[];
  occurrences: Occurrence[];
}

class PastoralRoomService {
  async getAllReportsAndOccurrences(): Promise<PastoralRoomData> {
    try {
      // Buscar relatórios de culto
      const [cultReportsRows] = await pool.execute<any[]>(
        `SELECT 
          cr.id,
          cr.cult_date,
          cr.ministro,
          cr.assunto,
          cr.freq_total,
          cr.created_at
         FROM cult_reports cr
         ORDER BY cr.cult_date DESC, cr.created_at DESC
         LIMIT 50`
      );

      const cultReports: CultReport[] = cultReportsRows.map(row => ({
        id: row.id,
        ministry_id: 0,
        ministry_name: 'Diaconia',
        report_date: row.cult_date,
        title: row.assunto || 'Relatório de Culto',
        description: `Ministro: ${row.ministro || '-'} | Frequência: ${row.freq_total || 0}`,
        created_at: row.created_at,
        type: 'cult' as const
      }));

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
        cult_date: row.cult_date,
        responsavel: row.responsavel,
        endereco: row.endereco,
        bairro: row.bairro,
        participantes: row.participantes,
        offering_amount: row.offering_amount,
        observacoes: row.observacoes,
        created_at: row.created_at,
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
        date: row.date,
        reporter_name: row.reporter_name,
        witnesses: row.witnesses,
        location: row.location,
        description: row.description,
        created_at: row.created_at,
        type: 'occurrence' as const
      }));

      return {
        cultReports,
        smallFamilyReports,
        occurrences
      };
    } catch (error: any) {
      console.error('Erro ao buscar dados da Sala Pastoral:', error);
      throw new Error(`Erro ao buscar dados da Sala Pastoral: ${error.message}`);
    }
  }
}

export default new PastoralRoomService();
