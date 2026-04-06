// Dashboard Service
import pool from '../../shared/database/connection';
import { DashboardData, DashboardStats, RecentMember } from './dashboard.types';

class DashboardService {
  async getDashboardData(): Promise<DashboardData> {
    // Estatísticas
    const [[totalResult]] = await pool.execute<any[]>(
      'SELECT COUNT(*) as total FROM members'
    );
    
    const [[activesResult]] = await pool.execute<any[]>(
      "SELECT COUNT(*) as count FROM members WHERE status = 'Ativo'"
    );
    
    const [[inactivesResult]] = await pool.execute<any[]>(
      "SELECT COUNT(*) as count FROM members WHERE status = 'Inativo'"
    );
    
    const [[visitorsResult]] = await pool.execute<any[]>(
      "SELECT COUNT(*) as count FROM members WHERE status = 'Visitante'"
    );
    
    const [[recentResult]] = await pool.execute<any[]>(
      "SELECT COUNT(*) as count FROM members WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
    );

    const stats: DashboardStats = {
      total: totalResult.total,
      actives: activesResult.count,
      inactives: inactivesResult.count,
      visitors: visitorsResult.count,
      recentRegistrations: recentResult.count,
    };

    // Últimos membros cadastrados
    const [recentMembers] = await pool.execute<any[]>(
      `SELECT id, full_name, status, created_at 
       FROM members 
       ORDER BY created_at DESC 
       LIMIT 10`
    );

    return { stats, recentMembers };
  }
}

export default new DashboardService();
