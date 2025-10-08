export interface Check {
  img: string;
  lat: string | null;
  long: string | null;
  time: string;
}

export interface PeriodData {
  in?: Check;
  out?: Check;
  workhour?: number;
}

export interface Checklist {
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
  username: string;
  version?: string | null;
  role: string;
}


export interface WorkDaysProps {
  items: Workpoint[];
  user_id: string;
  username: string;
  userrole: string;
}