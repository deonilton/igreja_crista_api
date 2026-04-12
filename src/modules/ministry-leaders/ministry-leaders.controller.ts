import { Request, Response } from 'express';
import { ministryLeadersService } from './ministry-leaders.service';
import { CreateMinistryLeaderRequest, UpdateMinistryLeaderRequest } from './ministry-leaders.types';
import { isLeaderPortalAccessError } from '../../shared/validators/leaderPortalUserGate';

export class MinistryLeadersController {
  // Get all ministries with their leaders
  async getMinistriesWithLeaders(req: Request, res: Response) {
    try {
      const ministries = await ministryLeadersService.getMinistriesWithLeaders();
      
      res.json({
        ministries,
        total: ministries.length
      });
    } catch (error) {
      console.error('Error getting ministries with leaders:', error);
      res.status(500).json({
        error: 'Failed to get ministries with leaders',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get leaders of a specific ministry
  async getMinistryLeaders(req: Request, res: Response) {
    try {
      const { ministryId } = req.params;
      
      if (!ministryId || Array.isArray(ministryId)) {
        return res.status(400).json({
          error: 'Valid Ministry ID is required'
        });
      }

      const leaders = await ministryLeadersService.getMinistryLeaders(ministryId);
      res.json(leaders);
    } catch (error) {
      console.error('Error getting ministry leaders:', error);
      res.status(500).json({
        error: 'Failed to get ministry leaders',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Add leader to ministry
  async addLeader(req: Request, res: Response) {
    try {
      const { ministry_id, member_id, role } = req.body as CreateMinistryLeaderRequest;

      if (!ministry_id || !member_id || !role) {
        return res.status(400).json({
          error: 'Ministry ID, Member ID and Role are required'
        });
      }

      if (!['leader', 'co_leader'].includes(role)) {
        return res.status(400).json({
          error: 'Role must be "leader" or "co_leader"'
        });
      }

      const leader = await ministryLeadersService.addLeader({
        ministry_id,
        member_id,
        role
      });

      res.status(201).json(leader);
    } catch (error) {
      console.error('Error adding leader:', error);

      if (isLeaderPortalAccessError(error)) {
        return res.status(400).json({ error: error.message });
      }
      
      if (error instanceof Error) {
        if (error.message === 'Member not found') {
          return res.status(404).json({
            error: 'Member not found'
          });
        }
        if (error.message === 'Ministry not found or inactive') {
          return res.status(404).json({
            error: 'Ministry not found or inactive'
          });
        }
        if (error.message === 'Member is already a leader of this ministry') {
          return res.status(409).json({
            error: 'Member is already a leader of this ministry'
          });
        }
        if (
          error.message.includes('already has the maximum of 2') ||
          error.message.includes('máximo de 2')
        ) {
          return res.status(409).json({
            error: error.message
          });
        }
        if (
          error.message.includes('maximum of 4') ||
          error.message.includes('máximo de 4')
        ) {
          return res.status(409).json({
            error: error.message
          });
        }
      }

      res.status(500).json({
        error: 'Failed to add leader',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Update leader
  async updateLeader(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { member_id, role } = req.body as UpdateMinistryLeaderRequest;

      if (!id || Array.isArray(id) || !member_id) {
        return res.status(400).json({
          error: 'Valid Leader ID and Member ID are required'
        });
      }

      if (role && !['leader', 'co_leader'].includes(role)) {
        return res.status(400).json({
          error: 'Role must be "leader" or "co_leader"'
        });
      }

      const leader = await ministryLeadersService.updateLeader(parseInt(id), {
        member_id,
        role
      });

      res.json(leader);
    } catch (error) {
      console.error('Error updating leader:', error);

      if (isLeaderPortalAccessError(error)) {
        return res.status(400).json({ error: error.message });
      }
      
      if (error instanceof Error) {
        if (error.message === 'Leader not found') {
          return res.status(404).json({
            error: 'Leader not found'
          });
        }
        if (error.message === 'Member not found') {
          return res.status(404).json({
            error: 'Member not found'
          });
        }
        if (error.message === 'Member is already a leader of this ministry') {
          return res.status(409).json({
            error: 'Member is already a leader of this ministry'
          });
        }
        if (
          error.message.includes('already has the maximum of 2') ||
          error.message.includes('máximo de 2') ||
          error.message.includes('máximo de 4')
        ) {
          return res.status(409).json({
            error: error.message
          });
        }
      }

      res.status(500).json({
        error: 'Failed to update leader',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Remove leader
  async removeLeader(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id || Array.isArray(id)) {
        return res.status(400).json({
          error: 'Valid Leader ID is required'
        });
      }

      await ministryLeadersService.removeLeader(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error('Error removing leader:', error);
      
      if (error instanceof Error && error.message === 'Leader not found') {
        return res.status(404).json({
          error: 'Leader not found'
        });
      }

      res.status(500).json({
        error: 'Failed to remove leader',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Search members for autocomplete
  async searchMembers(req: Request, res: Response) {
    try {
      const { query } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          error: 'Search query is required'
        });
      }

      if (query.length < 2) {
        return res.json([]);
      }

      const members = await ministryLeadersService.searchMembers(query);
      res.json(members);
    } catch (error) {
      console.error('Error searching members:', error);
      res.status(500).json({
        error: 'Failed to search members',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get member leaderships
  async getMemberLeaderships(req: Request, res: Response) {
    try {
      const { memberId } = req.params;

      if (!memberId || Array.isArray(memberId)) {
        return res.status(400).json({
          error: 'Valid Member ID is required'
        });
      }

      const leaderships = await ministryLeadersService.getMemberLeaderships(parseInt(memberId));
      res.json(leaderships);
    } catch (error) {
      console.error('Error getting member memberships:', error);
      res.status(500).json({
        error: 'Failed to get member memberships',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const ministryLeadersController = new MinistryLeadersController();
