import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { Attendance, AttendanceSchema } from './attendance.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { GlobalModule } from 'src/providers/global.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: Attendance.name, schema: AttendanceSchema }]),
		GlobalModule,
	],
	controllers: [AttendanceController],
	providers: [AttendanceService],
	exports: [AttendanceService],	
})
export class AttendanceModule {}
