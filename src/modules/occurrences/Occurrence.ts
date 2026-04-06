export interface Occurrence {
  id: number;
  date: Date;
  reporter_name: string;
  witnesses: string | null;
  location: string;
  description: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateOccurrenceData {
  date: string;
  reporter_name: string;
  witnesses?: string;
  location: string;
  description: string;
}

export interface UpdateOccurrenceData {
  date?: string;
  reporter_name?: string;
  witnesses?: string;
  location?: string;
  description?: string;
}
