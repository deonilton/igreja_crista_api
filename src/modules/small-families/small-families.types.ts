export interface SmallFamily {
  id: number;
  member_id: number;
  created_at: string;
  updated_at: string;
  member?: {
    id: number;
    full_name: string;
    email: string | null;
    phone: string | null;
  };
}

export interface SmallFamiliesResponse {
  families: SmallFamily[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateSmallFamilyRequest {
  member_id: number;
}

export interface UpdateSmallFamilyRequest {
  member_id: number;
}

export interface MemberSearchResult {
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
}
