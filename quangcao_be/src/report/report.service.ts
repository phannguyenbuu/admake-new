import { forwardRef, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { AttendanceService } from 'src/attendance/attendance.service';
import { UserService } from 'src/user/user.service';
import { HolidayService } from 'src/holiday/holiday.service';
import { Types } from 'mongoose';
import { Attendance } from 'src/attendance/attendance.entity';
import { AttendanceStatus, AttendanceType } from 'src/attendance/attendance.enum';
import { SettingService } from 'src/setting/setting.service';
import { SettingKey, SettingValueTypes } from 'src/setting/setting.enum';
import { DateQueryDto } from '@libs/common/dto/date.dto';
import { Workbook } from 'exceljs';
import { FileUtil } from '@libs/common/utils/file.util';
import { Response } from 'express';
import { TaskService } from 'src/task/task.service';
import { TaskStatus } from 'src/task/task.enum';
import { UserStatus, UserType } from 'src/user/user.enum';
import { th } from '@faker-js/faker/.';
import { DateUtil } from '@libs/common/utils/date.util';
import { StringUtil } from '@libs/common/utils/string.util';
import { User } from 'src/user/user.entity';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthController } from 'src/auth/auth.controller';

@Injectable()
export class ReportService implements OnModuleInit {
    constructor(
        private readonly attendanceService: AttendanceService,
        private readonly userService: UserService,
        private readonly settingService: SettingService,
        private readonly taskService: TaskService,
        @Inject(forwardRef(() => EventEmitter2)) private eventEmitter: EventEmitter2
    ) {}
    private readonly cacheAttendance:Record<string,{
        lastActive:number;
        createdAt:number;
        data:any
    }> = {};
    private readonly cacheTaskGrid:Record<string,{
        lastActive:number;
        createdAt:number;
        data:any
    }> = {};
    async onModuleInit() {
        await this.report();
    }

    // cron 5p 1 lần
    @Cron(`*/5 * * * * *`, { timeZone: 'Asia/Ho_Chi_Minh' })
    async report() {
        // start and end date là thời gian đầu và kết thúc của tháng hiện tại
        const now = DateUtil.getNow();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const report = await this.getAttendanceReport({
            from: start.getTime(),
            to: end.getTime(),
        });
        AuthController.data = report.reduce((acc, item) => {
            acc[item._id?.toString() || ''] = item;
            return acc;
        }, {});
    }


    async fetchData(query: DateQueryDto) {
        const { from, to } = query;
        const tasks = await this.taskService.findAll({
            from,
            to,
            status: TaskStatus.DONE
        });
        const users = await this.userService.findAll({
            status: UserStatus.ACTIVE
        }); 
        const attendances = await this.attendanceService.findAll({
            from,
            to,
        });
        return {
            tasks,
            users,
            attendances
        };
    }



    // T1 :      Ngày công tháng có check in, check out hợp lệ
    // T2 :      Ngày công tháng có check in, check out hợp lệ và tăng ca
    // T3 :      Ngày công tháng không check in, check out
    // K1 :      Ngày công khoán có check in, check out hợp lệ
    // K2 :      Ngày công khoán có check in, check out hợp lệ và tăng ca
    // K3 :      Ngày công khoán không check in, check out
    public async getTaskGrid(query: DateQueryDto) {
        const cacheKey = `${query.from}-${query.to}`;
        if(this.cacheTaskGrid[cacheKey]) {
            if(this.cacheTaskGrid[cacheKey].lastActive > DateUtil.getNow().getTime() - 1000 * 60 * 5) {
                return this.cacheTaskGrid[cacheKey].data;
            }
        }
        const users = await this.userService.findAll();
        const attendanceGroupByUser = await this.attendanceService.groupByUser(new Date(query.from), new Date(query.to));
        const diffDays = DateUtil.diffDays(new Date(query.from), new Date(query.to)) + 1;
        const resultFinal:Array<{
            _id?: Types.ObjectId;
            name: string;
            attendances: {
                [key: string]: {
                    result: string;
                    year: number;
                    month: number;
                    day: number;
                    isSunday: boolean;
                };
            }
        }> = [];
        for (const user of users) {
            const attendances = attendanceGroupByUser[user._id.toString()];
            const prefix = user.type === UserType.EMPLOYEE ? "T" : "K";
            const resultByUser:{
                [key: string]: {
                    id?: Types.ObjectId;
                    result: string;
                    year: number;
                    month: number; 
                    day: number;
                    isSunday: boolean;
                };
            } = {};
            for (let i = 0; i < diffDays; i++) {
                const date = new Date(query.from);
                date.setDate(date.getDate() + i); 
                let key = `${date.getFullYear()}${StringUtil.padLeft(date.getMonth() + 1, 2)}${StringUtil.padLeft(date.getDate(), 2)}`;
                const attendance = attendances?.[key] ;
                let keyResult = await this.attendanceService.check(attendance);
                resultByUser[key] = {
                    id: attendance?._id,
                    result: `${prefix}${keyResult}`,
                    year: date.getFullYear(),
                    month: date.getMonth() + 1,
                    day: date.getDate(),
                    isSunday: date.getDay() === 0,
                };
            }
            resultFinal.push({
                _id: user._id,
                name: user.fullName,
                attendances: resultByUser
            }); 
        }
        this.cacheTaskGrid[cacheKey] = {
            lastActive:DateUtil.getNow().getTime(),
            createdAt:DateUtil.getNow().getTime(),
            data:resultFinal
        };
        return resultFinal;
    }


    // chấm công
    public async getAttendanceReport(query: DateQueryDto) {
        const cacheKey = `${query.from}-${query.to}`;
        if(this.cacheAttendance[cacheKey]) {
            if(this.cacheAttendance[cacheKey].lastActive > DateUtil.getNow().getTime() - 1000 * 60 * 5) {
                return this.cacheAttendance[cacheKey].data;
            }
        }
        const { from, to } = query;
        const users = await this.userService.findAllAndRole();
        const salaryLevelList = await this.settingService.getSettingType<{
            id: Types.ObjectId;
            salary: number;
            index: number;
        }[]>(SettingKey.SALARY_LEVEL);
        // hệ số tăng ca cho nhân viên tháng
        const salaryOvertime = await this.settingService.getSettingType<number>(SettingKey.SALARY_OVERTIME);
        // lương tăng ca cố định cho nhân viên khoán
        const salaryOvertimeFixed = await this.settingService.getSettingType<number>(SettingKey.SALARY_OVERTIME_FIXED);
        // số ngày làm việc
        const standardWorkingDays = await this.settingService.getStandardWorkingDays(new Date(from).getFullYear(), new Date(from).getMonth() + 1);
        const letFinalResult:Array<{
            _id?: Types.ObjectId;
            name: string;
            // ngày công
            dayWorking:number
            // số lượng tăng ca
            overtime:number // số giờ tăng ca
            totalTask:number, // số lượng task
            role:string, // chức vụ
            level_salary:number, // hệ số lương
            salary:number, // lương cơ bản
            reward:number, // thưởng
            total_salary:number, // lương thực lĩnh
            standardWorkingDays:number, // số ngày công chuẩn
        }> = [];
        for (const user of users) {
            let userResult = {
                _id: user._id,
                name: user.fullName,
                dayWorking:0,
                overtime:0,
                totalTask:0,
                role:user.role.name,
                level_salary:user.level_salary,
                reward:0,
                salary:salaryLevelList.find(level => level.index === user.level_salary)?.salary || salaryLevelList[0].salary,
                total_salary:0,
                standardWorkingDays:standardWorkingDays,
            }
            const attendances = await this.attendanceService.findAll({
                userId: user._id,
                createdAt:{
                    $gte:new Date(from),
                    $lte:new Date(to)
                }
            });
            let userOvertime = 0;
            for (const attendance of attendances) {
                if(attendance.createdAt.getDay() === 0) {
                    continue;
                }
                let r = await this.attendanceService.check(attendance);
                if(r === 1 || r === 2) {
                    userResult.dayWorking++;
                    if(r === 2) {
                        userOvertime += attendance.records[AttendanceType.OUT]?.overtime || 0;
                    }
                }
            }
            let overtime = Math.round(userOvertime / 0.1) * 0.1;
            let totalSalary = Math.round((userResult.salary/standardWorkingDays) * userResult.dayWorking);
            console.log(userResult.salary,standardWorkingDays,userResult.salary/standardWorkingDays,userResult.dayWorking,totalSalary);
            let tasks = await this.taskService.findAll({
                confirmDate:{
                    $gte:new Date(from),
                    $lte:new Date(to)
                },
                assignIds:{
                    $in:[user._id]
                },
                status:TaskStatus.REWARD,
            })
            userResult.totalTask = tasks.length;
            userResult.reward = tasks.reduce((acc, task) => acc + (task.reward / task.assignIds.length), 0);
            userResult.overtime = overtime;
            if(user.type === UserType.EMPLOYEE)
            {
                let salaryOnHour = (userResult.salary / 8) * (salaryOvertime/100); 
                totalSalary += (overtime / 60) * salaryOnHour;
            }
            if(user.type === UserType.EMPLOYEE_LOAN)
            {
                totalSalary += (overtime / 60) * salaryOvertimeFixed;
            }

            userResult.total_salary = totalSalary + userResult.reward;
            letFinalResult.push(userResult);
        }
        letFinalResult.sort((a, b) => b.total_salary - a.total_salary);
        this.cacheAttendance[cacheKey] = {
            lastActive:DateUtil.getNow().getTime(),
            createdAt:DateUtil.getNow().getTime(),
            data:letFinalResult
        };
        return letFinalResult;
    }
}
