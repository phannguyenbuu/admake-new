import type { Leave } from "./leave.type";

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
  status: string;


  start_time: string; // ISO string
  end_time: string;   // ISO string
  reason: string;
  morning: boolean;
  noon: boolean;
}


export interface WorkDaysProps {
  items: Workpoint[];
  user_id: string;
  username: string;
  userrole: string;
}