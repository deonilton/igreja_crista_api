// Dashboard Types
export interface DashboardStats {
  total: number;
  actives: number;
  inactives: number;
  visitors: number;
  recentRegistrations: number;
}

export interface RecentMember {
  id: number;
  full_name: string;
  status: string;
  created_at: Date;
}

export interface DashboardData {
  stats: DashboardStats;
  recentMembers: RecentMember[];
}
