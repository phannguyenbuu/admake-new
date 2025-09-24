import { Body, Controller, Get, Post, UploadedFile, Param, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { Attendance } from './attendance.entity';
import { ApiController, ApiFile, ApiModel, ApiNote } from '@libs/common/decorators/api.decorator';
import { AuthService } from 'src/auth/auth.service';
import { AttendanceCheckDto, AttendanceGetByKeyDto, AttendanceReportDto } from './dto/attendance.dto';
import { BufferFile } from '@libs/common/@types/utils';
import { FileUtil } from '@libs/common/utils/file.util';
import { IdDto } from '@libs/common/dto/id.dto';
import { Types } from 'mongoose';
import { th } from '@faker-js/faker/.';
import { GoongService } from 'src/providers/goong.service';

@ApiController(Attendance.path)
export class AttendanceController {
	constructor(
		private readonly attendanceService: AttendanceService, 
		private readonly authService: AuthService
	) {}

	@Get()
	@ApiNote('Lấy thông tin chấm công hiện tại')
	@ApiModel(Attendance)
	async getCurrent() {
		const user = await this.authService.currentUser();
		return await this.attendanceService.getCurrentAttendance(user);
	}

	@Get('report')
	@ApiNote('Lấy báo cáo chấm công')
	@ApiModel([Attendance])
	async getAttendanceReport(@Query() query: AttendanceReportDto) {
		const user = await this.authService.currentUser();
		return await this.attendanceService.getAttendanceReport(user, query);
	}

	@Get('report/:id')
	@ApiNote('Lấy báo cáo chấm  công của người dùng')
	@ApiModel([Attendance])
	async getAttendanceReportByUser(@Param() param: IdDto, @Query() query: AttendanceReportDto) {
		return await this.attendanceService.getAttendanceReportByUser(new Types.ObjectId(param.id), query);
	}


	@Post("/getByKey")
	@ApiNote('Lấy thông tin chấm công theo key')
	@ApiModel(Attendance)
	async getAttendanceByKey(@Body() 	param: AttendanceGetByKeyDto) {
		return await this.attendanceService.getAttendance(new Types.ObjectId(param.userId),param.key);
	}

	@Post('check')
	@ApiNote('Chấm công')
	@ApiFile('image')
	async checkAttendance(@Body() body: AttendanceCheckDto, @UploadedFile() image: BufferFile) {
		const user = await this.authService.currentUser();
		if (image) {
			const imagePath = await FileUtil.SaveFileBuffer(image, {
				randomName: true,
				destination: Attendance.path,
			});
			return await this.attendanceService.checkAttendance(user, body, imagePath);
		}
		return await this.attendanceService.checkAttendance(user, body);
	}

	@Get('test-clear-attendance')
	async testClearAttendance() {
		const user = await this.authService.currentUser();
		const att = await this.attendanceService.getCurrentAttendance(user);
		await this.attendanceService.deleteOne({ _id: att._id });
	}
}
