import { ServiceBase } from '@libs/common/base/service.base';
import { Injectable, Logger } from '@nestjs/common';
import { Attendance } from './attendance.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from 'src/user/user.entity';
import { AttendanceStatus, AttendanceType } from './attendance.enum';
import { AttendanceCheckDto, AttendanceReportDto } from './dto/attendance.dto';
import { StringUtil } from '@libs/common/utils/string.util';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserType } from 'src/user/user.enum';
import { AttendanceRecord } from './attendance.type';
import { Holiday } from 'src/holiday/holiday.entity';
import { ApiException } from '@libs/common/exception/api.exception';
import { DateUtil } from '@libs/common/utils/date.util';
import { GoongService } from 'src/providers/goong.service';

@Injectable()
export class AttendanceService extends ServiceBase<Attendance> {



	/**
	 * Lấy giờ checkin, checkout (HH:mm) và tổng thời gian làm việc (phút)
	 * @param attendance Bản ghi chấm công
	 */
	public getAttendanceTimes(attendance: Attendance) {
		const checkinDate: Date | null = attendance.records?.in?.time ?? null;
		const checkoutDate: Date | null = attendance.records?.out?.time ?? null;
		const checkin = checkinDate
			? `${checkinDate.getHours().toString().padStart(2, '0')}:${checkinDate
					.getMinutes()
					.toString()
					.padStart(2, '0')}`
			: null;
		const checkout = checkoutDate
			? `${checkoutDate.getHours().toString().padStart(2, '0')}:${checkoutDate
					.getMinutes()
					.toString()
					.padStart(2, '0')}`
			: null;
		const totalTime =
			checkinDate && checkoutDate ? Math.round((checkoutDate.getTime() - checkinDate.getTime()) / 60000) : null; // phút
		return Object.freeze({ checkin, checkout, totalTime }); // readonly object
	}
	constructor(@InjectModel(Attendance.name) private attendanceModel: Model<Attendance>,private readonly goongService: GoongService) {
		super(attendanceModel);
	}

	public async generateKey() {
		const date = new Date();
		return `${StringUtil.padLeft(date.getFullYear(), 4)}${StringUtil.padLeft(date.getMonth() + 1,2,)}${StringUtil.padLeft(date.getDate(), 2)}`;
	}

    // tính công chuẩn
	public async getStandardWorkingDays(from: Date, to: Date) {
		const diffDays = DateUtil.diffDays(from, to);
		let totalWorkingTime = diffDays;
		for(let i = 0; i < diffDays; i++) {
			const date = new Date(from);
			date.setDate(date.getDate() + i);
			if(date.getDay() === 0) {
				totalWorkingTime--;
			}
		}
		return totalWorkingTime;
	}
	

	public async getCurrentAttendance(user: User , key?:string) {
		let dateCurrent = new Date();
		if(!key) {
			key = await this.generateKey();
		}
		else {
			// key is yyyyMMdd
			dateCurrent = new Date(`${key.substring(0, 4)}-${key.substring(4, 6)}-${key.substring(6, 8)}`);
		}
		const attendance = await this.attendanceModel.findOne({ userId: user._id, key: key });
		if (!attendance) {
			const date = new Date(dateCurrent);
			date.setHours(0, 0, 0, 0);
			return await this.attendanceModel.create({ userId: user._id, key: key, date: date });
		}

		let time_checkin = new Date(dateCurrent);
		time_checkin.setHours(7, 0, 0, 0);
		let time_checkout = new Date(dateCurrent);
		time_checkout.setHours(17, 0, 0, 0);
	
		return {
			time_checkin: time_checkin,
			time_checkout: time_checkout,
			late_checkin: Math.floor((Date.now() - time_checkin.getTime()) / 60000),
			early_checkout: Math.floor((time_checkout.getTime() - Date.now()) / 60000),
			...attendance.toJSON(),
		}
	}
	public async getAttendance(userId: Types.ObjectId, key:string) {
		console.log(userId, key);
		const attendance = await this.attendanceModel.findOne({ userId: userId, key: key });
		if (!attendance) {
			const date = new Date();
			date.setHours(0, 0, 0, 0);
			return await this.attendanceModel.create({ userId: userId, key: key, date: date });
		}
		console.log(attendance);
		let time_checkin = new Date();
		time_checkin.setHours(7, 0, 0, 0);
		let time_checkout = new Date();
		time_checkout.setHours(17, 0, 0, 0);
		
		return {
			time_checkin: time_checkin,
			time_checkout: time_checkout,
			late_checkin: Math.floor((Date.now() - time_checkin.getTime()) / 60000),
			early_checkout: Math.floor((time_checkout.getTime() - Date.now()) / 60000),
			...attendance.toJSON(),
		}
	}


	public async checkAttendance(user: User, data: AttendanceCheckDto, image?: string, taskId?: Types.ObjectId) {
		const time = new Date();
		const key = await this.generateKey();
		let attendance = await this.attendanceModel.findOne({ userId: user._id, key });
		if (!attendance) {
			attendance = await this.attendanceModel.create({ userId: user._id, key, date: time });
		}
		let resultMap:Awaited<ReturnType<GoongService['toAddress']>>['results'][number] | null = null;
		if(data.latitude && data.longitude && data.latitude.toString().length > 5 && data.longitude.toString().length > 5)  {
			resultMap = (await this.goongService.toAddress(data.latitude.toString(), data.longitude.toString())).results?.[0];
			console.log(resultMap);
		}
		const type = data.type;
		// tính theo phút
		let late = 0;
		let early_leave = 0;
		let lack = 0;
		let overtime = 0;
		// Xác định status
		let status = AttendanceStatus.NORMAL;
		const hour = time.getHours();
		const minute = time.getMinutes();
		if (type === AttendanceType.IN) {
			if (hour < 7) {
				status = AttendanceStatus.EARLY;
			} else if (hour === 7 && minute === 0) {
				status = AttendanceStatus.NORMAL;
			} else if (hour > 7 || (hour === 7 && minute > 0)) {
				status = AttendanceStatus.LATE;
				late = (hour - 7) * 60 + minute;
			}
        } else if (type === AttendanceType.OUT) {
            if (hour < 17) {
                status = AttendanceStatus.EARLY_LEAVE;
                early_leave = 17 * 60 - (hour * 60 + minute);
            } else if (hour >= 17 && hour < 22) {
				status = AttendanceStatus.OVERTIME;
				overtime = (hour - 17) * 60 + minute;
			} else if (hour >= 22) {
				status = AttendanceStatus.LACK;
				lack = (hour - 22) * 60 + minute;
			}
		}

		// Ghi nhận thông tin chấm công
		const record: AttendanceRecord = {
			time: time,
			longitude: data.longitude ?? null,
			latitude: data.latitude ?? null,
			ssid: data.ssid ?? null,
			bssid: data.bssid ?? null,
			image: image ?? undefined,
			note: data.note ?? undefined,
			status: status,
			late: late,
			early_leave: early_leave,
			lack: lack,
			overtime: overtime,
			map: resultMap,
		};
		attendance.records[type] = record;
		if(taskId)
		{
			attendance.taskId = taskId;
		}
		return await this.attendanceModel.findByIdAndUpdate(
			attendance._id,
			{
				records: attendance.records,
			},
			{ new: true },
		);
	}


	public async updateAttendanceNoNeedCheck(attendance_id:Types.ObjectId,holiday:Holiday,type:AttendanceType) {
		const attendance = await this.attendanceModel.findById(attendance_id);
		if (!attendance) {
			throw ApiException.ATTENDANCE_NOT_FOUND;
		}
		const time = new Date();
		time.setHours(0, 0, 0, 0);
		attendance.records[type] = {
			time: time,
			status: AttendanceStatus.NO_NEED_CHECK,
		};
		attendance.holidayId = holiday._id;
		return await this.attendanceModel.findByIdAndUpdate(attendance._id, attendance, { new: true });
	}

	public async updateLackAttendance(attendance_id:Types.ObjectId,type:AttendanceType) {
		const attendance = await this.attendanceModel.findById(attendance_id);
		if (!attendance) {
			throw ApiException.ATTENDANCE_NOT_FOUND;
		}
		const time = new Date();
		if(type === AttendanceType.IN) {
			time.setHours(12, 0, 0, 0);
		} else {
			time.setHours(22, 0, 0, 0);
		}
		attendance.records[type] = {
			time: time,
			status: AttendanceStatus.LACK,
		};
		return await this.attendanceModel.findByIdAndUpdate(attendance._id, attendance, { new: true });
	}

	public async getAttendanceReport(user: User, query: AttendanceReportDto) {
		const fromDate = new Date(query.from ?? Date.now());
		fromDate.setHours(0, 0, 0, 0);
		const toDate = new Date(query.to ?? Date.now());
		toDate.setHours(23, 59, 59, 999);
		return await this.attendanceModel
			.find({
				userId: user._id,
				createdAt: { $gte: fromDate, $lte: toDate },
			})
			.sort({ createdAt: 1 });
	}

	public async getAttendanceReportByUser(id: Types.ObjectId, query: AttendanceReportDto) {
		const fromDate = new Date(query.from ?? Date.now());
		fromDate.setHours(0, 0, 0, 0);
		const toDate = new Date(query.to ?? Date.now());
		toDate.setHours(23, 59, 59, 999);
		return await this.attendanceModel
			.find({
				userId: id,
				createdAt: { $gte: fromDate, $lte: toDate },
			})
			.sort({ createdAt: 1 });
	}

	public async check(attendance: Attendance) {
		let keyResult = 3
		if(attendance && attendance?.records?.[AttendanceType.IN] && attendance.records[AttendanceType.IN].status != AttendanceStatus.LACK) {
			keyResult = 1;
		}
		if(keyResult === 1 && attendance && attendance?.records?.[AttendanceType.OUT] && attendance.records[AttendanceType.OUT].status == AttendanceStatus.OVERTIME) {
			keyResult = 2;
		}
		return keyResult;
	}

	public async groupByUser(from: Date, to: Date) {
		const result = await this.attendanceModel
			.aggregate<{_id: Types.ObjectId, attendances: Attendance[]}>([
				{
					$match: {
						createdAt: { $gte: from, $lte: to },
					},
				},
				{
					$group: {
						_id: '$userId',
						attendances: { $push: '$$ROOT' },
					},
				},
			]);
		return result.reduce((acc, item) => {
			acc[item._id.toString()] = item.attendances.reduce((acc, attendance) => {
				acc[attendance.key] = attendance;
				return acc;
			}, {} as Record<string, Attendance>);
			return acc;
		}, {} as Record<string, Record<string, Attendance>>);
	}
}
