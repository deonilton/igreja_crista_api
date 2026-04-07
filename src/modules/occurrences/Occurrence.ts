export interface Occurrence {
  id: number;
  ministry_id: string;
  date: Date;
  reporter_name: string;
  witnesses: string | null;
  location: string;
  description: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateOccurrenceData {
  ministry_id: string;
  date: string;
  reporter_name: string;
  witnesses?: string;
  location: string;
  description: string;
}

export interface UpdateOccurrenceData {
  ministry_id?: string;
  date?: string;
  reporter_name?: string;
  witnesses?: string;
  location?: string;
  description?: string;
}
