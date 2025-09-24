import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AttendanceService } from 'src/attendance/attendance.service';
import { HolidayService } from 'src/holiday/holiday.service';
import { UserService } from 'src/user/user.service';
import { NotificationService } from 'src/notification/notification.service';
import { AppGateway } from 'src/providers/app.gateway';
import { DateUtil } from '@libs/common/utils/date.util';
import { DateRange } from '@libs/common/obj/date';
import { AttendanceType } from 'src/attendance/attendance.enum';
import { UserStatus } from 'src/user/user.enum';
import { SettingService } from 'src/setting/setting.service';
import { SettingKey } from 'src/setting/setting.enum';
import { TaskService } from 'src/task/task.service';
import { TaskStatus } from 'src/task/task.enum';
import { AttendanceReportService } from './attendanceReport.service';
import { ReportService } from 'src/report/report.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CronService {
	constructor(
		private readonly holidayService: HolidayService,
		private readonly userService: UserService,
		private readonly attendanceService: AttendanceService,
		private readonly settingService: SettingService,
		private readonly taskService: TaskService,

	) {}

    // cron vào đầu ngày 12h đêm
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'Asia/Ho_Chi_Minh' })
	async autoCreateAttendance() {
        const users = await this.userService.findAll({ status: UserStatus.ACTIVE });
        for (const user of users) {
            try {
                await this.attendanceService.getCurrentAttendance(user);
            } catch (error) {}
        }
	}


    // cron vào 12h trưa để chốt checkin
    @Cron(CronExpression.EVERY_DAY_AT_NOON, { timeZone: 'Asia/Ho_Chi_Minh' })
	async checkAttendance() {
        const users = await this.userService.findAll({ status: UserStatus.ACTIVE });
		const now = DateUtil.getNow();
		const range = now.getRange(DateRange.TODAY);
        for (const user of users) {
            try {
                const holiday = await this.holidayService.findOne({
                    forUserId: user._id,
                    startDate: { $lte: range.end },
                    endDate: { $gte: range.start },
                });
                const attendance = await this.attendanceService.getCurrentAttendance(user);
                const hasIn = !!attendance?.records?.[AttendanceType.IN]?.time;
                if (hasIn) continue; // không ghi đè nếu đã có bản ghi
                if (!holiday) {
                    await this.attendanceService.updateLackAttendance(attendance._id, AttendanceType.IN);
                } else {
                    await this.attendanceService.updateAttendanceNoNeedCheck(attendance._id, holiday, AttendanceType.IN);
                }
            } catch (error) {}
        }
	}

    // cron vào 0h0p ngày 1 để tạo ngày công chuẩn
    @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT, { timeZone: 'Asia/Ho_Chi_Minh' })
    async createStandardWorkingDays() {
        const now = DateUtil.getNow();
        const standardWorkingDays = await this.settingService.getSettingType(SettingKey.STANDARD_WORKING_DAYS);
        if(standardWorkingDays && !standardWorkingDays[`${now.getFullYear()}-${now.getMonth() + 1}`]) {
            standardWorkingDays[`${now.getFullYear()}-${now.getMonth() + 1}`] = {
                year: now.getFullYear(),
                month: now.getMonth() + 1,
                days: 26,
            };
            await this.settingService.updateSetting(SettingKey.STANDARD_WORKING_DAYS, standardWorkingDays);
        }
    }

    // cron vào 12h đêm để chốt công việc
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'Asia/Ho_Chi_Minh' })
    async checkTask() {
        const tasks = await this.taskService.model.find({
            endTime: { $lte: DateUtil.getNow() },
        });
        for (const task of tasks) {
            await this.taskService.model.findByIdAndUpdate(task._id, {
                status: TaskStatus.DONE,
            });
        }
    }

    
    // cron vào 23h58p đêm để chốt checkout 
    @Cron(`55 23 * * *`, { timeZone: 'Asia/Ho_Chi_Minh' })
	async checkAttendanceOut() {
        const users = await this.userService.findAll({ status: UserStatus.ACTIVE });
		const now = DateUtil.getNow();
		const range = now.getRange(DateRange.TODAY);
        for (const user of users) {
            try {
                const holiday = await this.holidayService.findOne({
                    forUserId: user._id,
                    startDate: { $lte: range.end },
                    endDate: { $gte: range.start },
                });
                const attendance = await this.attendanceService.getCurrentAttendance(user);
                const hasOut = !!attendance?.records?.[AttendanceType.OUT]?.time;
                if (hasOut) continue; // không ghi đè nếu đã có bản ghi
                if (!holiday) {
                    await this.attendanceService.updateLackAttendance(attendance._id, AttendanceType.OUT);
                } else {
                    await this.attendanceService.updateAttendanceNoNeedCheck(attendance._id, holiday, AttendanceType.OUT);
                }
            } catch (error) {}
        }
	}
}
