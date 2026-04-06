// Users Types
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  ministries: string[];
  created_at: Date;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: string;
  ministries?: string[];
}

export interface UpdateUserRequest {
  name: string;
  email: string;
  role: string;
  ministries?: string[];
  password?: string;
}
