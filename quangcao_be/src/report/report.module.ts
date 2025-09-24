import { Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { AttendanceModule } from 'src/attendance/attendance.module';
import { UserModule } from 'src/user/user.module';
import { HolidayModule } from 'src/holiday/holiday.module';
import { SettingModule } from 'src/setting/setting.module';
import { TaskModule } from 'src/task/task.module';
import { AttendanceReportService } from 'src/providers/attendanceReport.service';
import { PayrollReportService } from 'src/providers/payrollReport.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports:[
    AttendanceModule,UserModule,HolidayModule,SettingModule,TaskModule],
  controllers: [ReportController],
  providers: [ReportService, AttendanceReportService, PayrollReportService],
  exports: [ReportService]
})
export class ReportModule {}
