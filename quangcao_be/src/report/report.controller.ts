import { Controller, Get, Param, Query, Res, StreamableFile } from '@nestjs/common';
import { ApiController, ApiNote } from '@libs/common/decorators/api.decorator';
import { DateQueryDto } from '@libs/common/dto/date.dto';
import { IdDto } from '@libs/common/dto/id.dto';
import { ReportService } from './report.service';
import { RequirePermission } from '@libs/common/decorators/permission.decorator';
import { UserPermission } from 'src/user/user.enum';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import { AttendanceReportService } from 'src/providers/attendanceReport.service';
import { PayrollReportService } from 'src/providers/payrollReport.service';

@ApiController('report')
@RequirePermission(UserPermission.ACCOUNTING_MANAGEMENT)
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly attendanceReportService: AttendanceReportService,
    private readonly payrollReportService: PayrollReportService) {}

  // Chấm công
  @Get('task/grid')
  @ApiNote('Bảng ma trận chấm công theo ngày (cột: ngày, dòng: nhân sự) chấm công')
  async taskGrid(@Query() query: DateQueryDto) {
    return this.reportService.getTaskGrid(query);
  } 

  // tính công
  @Get('attendance')
  @ApiNote('Tính công')
  async attendance(@Query() query: DateQueryDto) {
    return this.reportService.getAttendanceReport(query);
  }

  // excel chấm công 
  @Get('attendance/excel')
  @ApiNote('Excel chấm công')
async attendanceExcel(@Query() query: DateQueryDto, @Res() res: Response  ) {
    const data = await this.reportService.getTaskGrid(query);
    const date = new Date(query.from);
    const workbook = await this.attendanceReportService.buildMonthlyAttendanceExcel(data, date.getFullYear(), date.getMonth() + 1);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=chamcong-${date.getFullYear()}-${date.getMonth() + 1}.xlsx`);
    workbook.xlsx.write(res);
  }   

  // excel tính công
  @Get('attendance/excel/calculate')
  @ApiNote('Excel tính công')
  async attendanceExcelCalculate(@Query() query: DateQueryDto, @Res() res: Response) {
    const date = new Date(query.from);
    const data = await this.reportService.getAttendanceReport(query);
    const workbook = await this.payrollReportService.buildExcel(date.getFullYear(), date.getMonth() + 1, data);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=tinhcong-${date.getFullYear()}-${date.getMonth() + 1}.xlsx`);
    workbook.xlsx.write(res);
  }
}
