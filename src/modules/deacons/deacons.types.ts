export interface Deacon {
  id: number;
  member_id: number;
  created_at: string;
  updated_at: string;
  // Dados do membro via JOIN
  member?: {
    id: number;
    full_name: string;
    email: string | null;
    phone: string | null;
  };
}

export interface CreateDeaconRequest {
  member_id: number;
}

export interface UpdateDeaconRequest {
  member_id: number;
}

export interface DeaconsResponse {
  deacons: Deacon[];
  total: number;
  page: number;
  totalPages: number;
}

export interface MemberSearchResult {
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
}
