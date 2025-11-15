export interface Leave {
  user_id: string;
  start_time: string; // ISO string
  end_time: string;   // ISO string
  reason: string;
  morning: boolean;
  noon: boolean;
}