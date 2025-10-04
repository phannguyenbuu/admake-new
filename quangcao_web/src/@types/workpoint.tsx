

interface Check {
  img: string;
  lat: number | null;
  long: number | null;
  time: string;
}

interface PeriodData {
  in?: Check;
  out?: Check;
  workhour?: number;
}

interface Checklist {
  morning?: PeriodData;
  noon?: PeriodData;
  evening?: PeriodData;
}

export interface Workpoint {
  checklist: Checklist;
  createdAt: string;
  updatedAt: string;
  id: string;
  note?: string | null;
  deletedAt?: string | null;
  user_id: string;
  version?: string | null;
}