import { AttendanceStatus, AttendanceType } from './attendance.enum';
import { GoongService } from 'src/providers/goong.service';

export type AttendanceRecords = {
	[key in AttendanceType]: AttendanceRecord | null;
};

export type AttendanceRecord = {
	time: Date; // thời gian checkin/checkout
	longitude?: number | null; // kinh độ
	latitude?: number | null; // vĩ độ
	ssid?: string | null; // tên wifi
	bssid?: string | null; // mac wifi
	image?: string; // ảnh checkin/checkout
	note?: string; // ghi chú
	status: AttendanceStatus; // trạng thái checkin/checkout
	overtime?: number; // thời gian làm thêm
	late?: number; // thời gian trễ
	early_leave?: number; // thời gian sớm về
	lack?: number; // thời gian thiếu
	map?: Awaited<ReturnType<GoongService['toAddress']>>['results'][number] | null; // địa chỉ
};
