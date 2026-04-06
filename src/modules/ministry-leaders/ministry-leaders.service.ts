import pool from '../../shared/database/connection';
import { 
  MinistryLeader, 
  Ministry, 
  MinistryWithLeaders,
  CreateMinistryLeaderRequest,
  UpdateMinistryLeaderRequest,
  MemberSearchResult 
} from './ministry-leaders.types';

export class MinistryLeadersService {
  // Get all ministries with their leaders
  async getMinistriesWithLeaders(): Promise<MinistryWithLeaders[]> {
    try {
      const connection = await pool.getConnection();
      
      // First, get all active ministries
      const [ministriesRows] = await connection.execute(
        `SELECT name as id, name, display_name, description, icon, is_active 
         FROM ministries 
         WHERE is_active = true 
         ORDER BY display_name`
      );

      const ministries = ministriesRows as Ministry[];

      // Then, get all leaders with member information
      const [leadersRows] = await connection.execute(
        `SELECT ml.id, ml.ministry_id, ml.member_id, ml.role, ml.created_at, ml.updated_at,
                m.id as member_id, m.full_name, m.email, m.phone
         FROM ministry_leaders ml
         LEFT JOIN members m ON ml.member_id = m.id
         LEFT JOIN ministries min ON ml.ministry_id = min.name COLLATE utf8mb4_unicode_ci
         ORDER BY ml.ministry_id, ml.role, ml.created_at`
      );

      const leaders = leadersRows as any[];

      // Group leaders by ministry
      const ministriesWithLeaders: MinistryWithLeaders[] = ministries.map(ministry => {
        const ministryLeaders = leaders
          .filter(leader => leader.ministry_id === ministry.name)
          .map(leader => ({
            id: leader.id,
            ministry_id: leader.ministry_id,
            member_id: leader.member_id,
            role: leader.role,
            created_at: leader.created_at,
            updated_at: leader.updated_at,
            member: leader.member_id ? {
              id: leader.member_id,
              full_name: leader.full_name,
              email: leader.email,
              phone: leader.phone
            } : undefined
          }));

        return {
          ...ministry,
          leaders: ministryLeaders
        };
      });

      connection.release();
      return ministriesWithLeaders;
    } catch (error) {
      console.error('Error getting ministries with leaders:', error);
      throw new Error('Failed to get ministries with leaders');
    }
  }

  // Get leaders of a specific ministry
  async getMinistryLeaders(ministryId: string): Promise<MinistryLeader[]> {
    try {
      const connection = await pool.getConnection();
      
      const [rows] = await connection.execute(
        `SELECT ml.id, ml.ministry_id, ml.member_id, ml.role, ml.created_at, ml.updated_at,
                m.id as member_id, m.full_name, m.email, m.phone
         FROM ministry_leaders ml
         LEFT JOIN members m ON ml.member_id = m.id
         WHERE ml.ministry_id = ?
         ORDER BY ml.role, ml.created_at`,
        [ministryId]
      );

      const leaders = (rows as any[]).map(leader => ({
        id: leader.id,
        ministry_id: leader.ministry_id,
        member_id: leader.member_id,
        role: leader.role,
        created_at: leader.created_at,
        updated_at: leader.updated_at,
        member: leader.member_id ? {
          id: leader.member_id,
          full_name: leader.full_name,
          email: leader.email,
          phone: leader.phone
        } : undefined
      }));

      connection.release();
      return leaders;
    } catch (error) {
      console.error('Error getting ministry leaders:', error);
      throw new Error('Failed to get ministry leaders');
    }
  }

  // Add leader to ministry
  async addLeader(data: CreateMinistryLeaderRequest): Promise<MinistryLeader> {
    try {
      const connection = await pool.getConnection();

      // Check if member exists
      const [memberRows] = await connection.execute(
        'SELECT id, full_name, email, phone FROM members WHERE id = ?',
        [data.member_id]
      );

      if ((memberRows as any[]).length === 0) {
        connection.release();
        throw new Error('Member not found');
      }

      // Check if ministry exists and is active
      const [ministryRows] = await connection.execute(
        'SELECT id, name, display_name FROM ministries WHERE name = ? AND is_active = true',
        [data.ministry_id]
      );

      if ((ministryRows as any[]).length === 0) {
        connection.release();
        throw new Error('Ministry not found or inactive');
      }

      // Check if member is already a leader of this ministry
      const [existingRows] = await connection.execute(
        'SELECT id FROM ministry_leaders WHERE ministry_id = ? AND member_id = ?',
        [data.ministry_id, data.member_id]
      );

      if ((existingRows as any[]).length > 0) {
        connection.release();
        throw new Error('Member is already a leader of this ministry');
      }

      // Check if this specific role already has 2 leaders (couple)
      const [roleCountRows] = await connection.execute(
        'SELECT COUNT(*) as count FROM ministry_leaders WHERE ministry_id = ? AND role = ?',
        [data.ministry_id, data.role]
      );

      const roleCount = (roleCountRows as any[])[0].count;
      if (roleCount >= 2) {
        connection.release();
        throw new Error(`Ministry already has the maximum of 2 ${data.role === 'leader' ? 'leaders' : 'co-leaders'} (couple)`);
      }

      // Check if ministry already has 4 leaders total (2 leaders + 2 co-leaders)
      const [totalCountRows] = await connection.execute(
        'SELECT COUNT(*) as count FROM ministry_leaders WHERE ministry_id = ?',
        [data.ministry_id]
      );

      const totalCount = (totalCountRows as any[])[0].count;
      if (totalCount >= 4) {
        connection.release();
        throw new Error('Ministry already has maximum of 4 leaders (2 leaders + 2 co-leaders)');
      }

      // Insert the new leader
      const [result] = await connection.execute(
        'INSERT INTO ministry_leaders (ministry_id, member_id, role) VALUES (?, ?, ?)',
        [data.ministry_id, data.member_id, data.role]
      );

      const insertId = (result as any).insertId;

      // Get the created leader with member information
      const [newLeaderRows] = await connection.execute(
        `SELECT ml.id, ml.ministry_id, ml.member_id, ml.role, ml.created_at, ml.updated_at,
                m.id as member_id, m.full_name, m.email, m.phone,
                min.id as ministry_id, min.name as ministry_name, min.display_name as ministry_display_name
         FROM ministry_leaders ml
         LEFT JOIN members m ON ml.member_id = m.id
         LEFT JOIN ministries min ON ml.ministry_id = min.id
         WHERE ml.id = ?`,
        [insertId]
      );

      const newLeader = (newLeaderRows as any[])[0];

      const leader: MinistryLeader = {
        id: newLeader.id,
        ministry_id: newLeader.ministry_id,
        member_id: newLeader.member_id,
        role: newLeader.role,
        created_at: newLeader.created_at,
        updated_at: newLeader.updated_at,
        member: newLeader.member_id ? {
          id: newLeader.member_id,
          full_name: newLeader.full_name,
          email: newLeader.email,
          phone: newLeader.phone
        } : undefined,
        ministry: newLeader.ministry_id ? {
          id: newLeader.ministry_id,
          name: newLeader.ministry_name,
          display_name: newLeader.ministry_display_name
        } : undefined
      };

      connection.release();
      return leader;
    } catch (error) {
      console.error('Error adding leader:', error);
      throw error;
    }
  }

  // Update leader
  async updateLeader(leaderId: number, data: UpdateMinistryLeaderRequest): Promise<MinistryLeader> {
    try {
      const connection = await pool.getConnection();

      // Check if leader exists
      const [existingLeaderRows] = await connection.execute(
        'SELECT id, ministry_id, member_id FROM ministry_leaders WHERE id = ?',
        [leaderId]
      );

      if ((existingLeaderRows as any[]).length === 0) {
        connection.release();
        throw new Error('Leader not found');
      }

      const existingLeader = (existingLeaderRows as any[])[0];

      // Check if new member exists
      const [memberRows] = await connection.execute(
        'SELECT id, full_name, email, phone FROM members WHERE id = ?',
        [data.member_id]
      );

      if ((memberRows as any[]).length === 0) {
        connection.release();
        throw new Error('Member not found');
      }

      // Check if new member is already a leader of this ministry (excluding current leader)
      const [duplicateRows] = await connection.execute(
        'SELECT id FROM ministry_leaders WHERE ministry_id = ? AND member_id = ? AND id != ?',
        [existingLeader.ministry_id, data.member_id, leaderId]
      );

      if ((duplicateRows as any[]).length > 0) {
        connection.release();
        throw new Error('Member is already a leader of this ministry');
      }

      // Check if new role is already taken by another leader (allow up to 2 per role)
      if (data.role) {
        const [roleCheckRows] = await connection.execute(
          'SELECT COUNT(*) as count FROM ministry_leaders WHERE ministry_id = ? AND role = ? AND id != ?',
          [existingLeader.ministry_id, data.role, leaderId]
        );

        const roleCount = (roleCheckRows as any[])[0].count;
        if (roleCount >= 2) {
          connection.release();
          throw new Error(`This ministry already has the maximum of 2 ${data.role === 'leader' ? 'leaders' : 'co-leaders'}`);
        }
      }

      // Update the leader
      const updates: string[] = ['member_id = ?', 'updated_at = CURRENT_TIMESTAMP'];
      const params: any[] = [data.member_id, leaderId];

      if (data.role) {
        updates.push('role = ?');
        params.unshift(data.role);
      }

      await connection.execute(
        `UPDATE ministry_leaders SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      // Get the updated leader with member information
      const [updatedLeaderRows] = await connection.execute(
        `SELECT ml.id, ml.ministry_id, ml.member_id, ml.role, ml.created_at, ml.updated_at,
                m.id as member_id, m.full_name, m.email, m.phone,
                min.id as ministry_id, min.name as ministry_name, min.display_name as ministry_display_name
         FROM ministry_leaders ml
         LEFT JOIN members m ON ml.member_id = m.id
         LEFT JOIN ministries min ON ml.ministry_id = min.id
         WHERE ml.id = ?`,
        [leaderId]
      );

      const updatedLeader = (updatedLeaderRows as any[])[0];

      const leader: MinistryLeader = {
        id: updatedLeader.id,
        ministry_id: updatedLeader.ministry_id,
        member_id: updatedLeader.member_id,
        role: updatedLeader.role,
        created_at: updatedLeader.created_at,
        updated_at: updatedLeader.updated_at,
        member: updatedLeader.member_id ? {
          id: updatedLeader.member_id,
          full_name: updatedLeader.full_name,
          email: updatedLeader.email,
          phone: updatedLeader.phone
        } : undefined,
        ministry: updatedLeader.ministry_id ? {
          id: updatedLeader.ministry_id,
          name: updatedLeader.ministry_name,
          display_name: updatedLeader.ministry_display_name
        } : undefined
      };

      connection.release();
      return leader;
    } catch (error) {
      console.error('Error updating leader:', error);
      throw error;
    }
  }

  // Remove leader
  async removeLeader(leaderId: number): Promise<void> {
    try {
      const connection = await pool.getConnection();

      // Check if leader exists
      const [existingRows] = await connection.execute(
        'SELECT id FROM ministry_leaders WHERE id = ?',
        [leaderId]
      );

      if ((existingRows as any[]).length === 0) {
        connection.release();
        throw new Error('Leader not found');
      }

      // Delete the leader
      await connection.execute(
        'DELETE FROM ministry_leaders WHERE id = ?',
        [leaderId]
      );

      connection.release();
    } catch (error) {
      console.error('Error removing leader:', error);
      throw error;
    }
  }

  // Search members for autocomplete
  async searchMembers(query: string): Promise<MemberSearchResult[]> {
    try {
      const connection = await pool.getConnection();
      
      const [rows] = await connection.execute(
        `SELECT id, full_name, email, phone 
         FROM members 
         WHERE full_name LIKE ? OR email LIKE ?
         ORDER BY full_name
         LIMIT 10`,
        [`%${query}%`, `%${query}%`]
      );

      const members = (rows as any[]).map(member => ({
        id: member.id,
        full_name: member.full_name,
        email: member.email,
        phone: member.phone
      }));

      connection.release();
      return members;
    } catch (error) {
      console.error('Error searching members:', error);
      throw new Error('Failed to search members');
    }
  }

  // Get member leaderships
  async getMemberLeaderships(memberId: number): Promise<MinistryLeader[]> {
    try {
      const connection = await pool.getConnection();
      
      const [rows] = await connection.execute(
        `SELECT ml.id, ml.ministry_id, ml.member_id, ml.role, ml.created_at, ml.updated_at,
                min.id as ministry_id, min.name as ministry_name, min.display_name as ministry_display_name
         FROM ministry_leaders ml
         LEFT JOIN ministries min ON ml.ministry_id = min.id
         WHERE ml.member_id = ?
         ORDER BY ml.role, ml.created_at`,
        [memberId]
      );

      const leaderships = (rows as any[]).map(leader => ({
        id: leader.id,
        ministry_id: leader.ministry_id,
        member_id: leader.member_id,
        role: leader.role,
        created_at: leader.created_at,
        updated_at: leader.updated_at,
        ministry: leader.ministry_id ? {
          id: leader.ministry_id,
          name: leader.ministry_name,
          display_name: leader.ministry_display_name
        } : undefined
      }));

      connection.release();
      return leaderships;
    } catch (error) {
      console.error('Error getting member memberships:', error);
      throw new Error('Failed to get member memberships');
    }
  }
}

export const ministryLeadersService = new MinistryLeadersService();
