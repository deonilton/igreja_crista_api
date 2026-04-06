// Ministry Leaders Types

export type LeaderRole = 'leader' | 'co_leader';

export interface MinistryLeader {
  id: number;
  ministry_id: string;
  member_id: number;
  role: LeaderRole;
  created_at: Date;
  updated_at: Date;
  member?: {
    id: number;
    full_name: string;
    email?: string;
    phone?: string;
  };
  ministry?: {
    id: string;
    name: string;
    display_name: string;
  };
}

export interface Ministry {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  is_active: boolean;
}

export interface MinistryWithLeaders extends Ministry {
  leaders: MinistryLeader[];
}

export interface CreateMinistryLeaderRequest {
  ministry_id: string;
  member_id: number;
  role: LeaderRole;
}

export interface UpdateMinistryLeaderRequest {
  member_id: number;
  role?: LeaderRole;
}

export interface MemberSearchResult {
  id: number;
  full_name: string;
  email?: string;
  phone?: string;
}

export interface MinistryLeadersResponse {
  ministries: MinistryWithLeaders[];
  total: number;
}
