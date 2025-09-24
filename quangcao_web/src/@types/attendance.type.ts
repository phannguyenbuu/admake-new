import type { BaseEntity } from "./common.type";
import type { User } from "./user.type";
import type dayjs from "dayjs";

export interface CheckBody {
  image?: string; // binary string (base64 hoặc URL)
  longitude?: number;
  latitude?: number;
  ssid?: string;
  bssid?: string;
  note?: string;
  type: "in" | "out"; // bắt buộc
}
export interface ReportTime {
  to: string;
}

export interface ReportById extends ReportTime {
  id: string;
}

export interface Attendance extends BaseEntity {
  time_checkin: string;
  time_checkout: string;
  late_checkin: number;
  early_checkout: number;
  userId: string;
  key: string;
  date: string;
  records: {
    in: {
      time: string;
      longitude: number;
      latitude: number;
      ssid: string;
      bssid: string;
      image: string | null;
      note: string;
      status: string;
      late: number;
      early_leave: number;
      lack: number;
      overtime: number;
      map: Map;
    };
    out: {
      time: string;
      longitude: number;
      latitude: number;
      ssid: string;
      bssid: string;
      image: string | null;
      note: string;
      status: string;
      late: number;
      early_leave: number;
      lack: number;
      overtime: number;
      map: Map;
    };
  };
}

export interface Map {
  address_components: [
    {
      long_name: string;
      short_name: string;
    },
    {
      long_name: string;
      short_name: string;
    },
    {
      long_name: string;
      short_name: string;
    }
  ];
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
    boundary: string;
  };
  place_id: string;
  reference: string;
  plus_code: null;
  compound: {
    commune: string;
    province: string;
  };
  types: [];
  name: string;
  address: string;
}

export interface AttendanceByKey {
  key: string;
  records: {
    in: {
      time: string;
      longitude: number;
      latitude: number;
      ssid: string;
      bssid: string;
      image: string;
      note: string;
      status: string;
      late: number;
      early_leave: number;
      lack: number;
      overtime: number;
    };
    out: {
      time: string;
      longitude: number;
      latitude: number;
      ssid: string;
      bssid: string;
      image: string;
      note: string;
      status: string;
      late: number;
      early_leave: number;
      lack: number;
      overtime: number;
    };
  };
  date: string;
  image: string;
  taskId: string;
  holidayId: string;
}
export interface HeaderSectionProps {
  attendanceDate?: string;
  userInfo?: User | null;
}

export interface ClockSectionProps {
  now: dayjs.Dayjs;
  isCheckedIn: boolean;
  isCheckingIn?: boolean;
  attendance?: Attendance;
  checkInAddress?: string;
  checkInAddressLoading?: boolean;
  onCheckIn?: (file: File) => void;
  onResetCheckIn?: boolean;
  setOnResetCheckIn?: (value: boolean) => void;
}
