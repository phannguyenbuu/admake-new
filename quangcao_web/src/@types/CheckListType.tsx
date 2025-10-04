export interface PeriodData {
  in?: {
    img: string;
    lat: string | null;
    long: string | null;
    time: string;
  };
  out?: {
    img: string;
    lat: string | null;
    long: string | null;
    time: string;
  };
  workhour?: number;
}

export interface CheckListPeriod {
  morning?: PeriodData;
  noon?: PeriodData;
  evening?: PeriodData;
}

export interface PeriodHour {
  morning: number;
  noon: number;
  evening: number;
}


export interface CheckListProps {
  checklist: CheckListPeriod;
  createdAt: string;
  updatedAt: string;
  id: string;
  user_id: string;
}
