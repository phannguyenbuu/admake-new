import { DocumentBase } from '@libs/common/base/document.base';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { User } from 'src/user/user.entity';
import { IsDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { AttendanceRecords } from './attendance.type';
import { AttendanceStatus, AttendanceType } from './attendance.enum';
import { Task } from 'src/task/task.entity';
import { Holiday } from 'src/holiday/holiday.entity';
import { UserType } from 'src/user/user.enum';

@Schema({
	timestamps: true,
})
export class Attendance extends DocumentBase {
	@Prop({ type: Types.ObjectId, ref: User.name })
	userId: Types.ObjectId;

	@Prop({ type: String, required: false })
	@ApiProperty({
		description: 'Key',
		example: 'key',
	})
	key: string;

	@Prop({ type: Object, required: false, default: {} })
	@ApiProperty({
		description: 'Records',
		example: {
			in: {
				time: Date.now(),
				longitude: 10.7769,
				latitude: 106.7099,
				ssid: 'ssid',
				bssid: 'bssid',
				image: 'image',
				note: 'note',
				status: AttendanceStatus.NORMAL,
				late: 0,
				early_leave: 0,
				lack: 0,
				overtime: 0,
			},
			out: {
				time: Date.now(),
				longitude: 10.7769,
				latitude: 106.7099,
				ssid: 'ssid',
				bssid: 'bssid',
				image: 'image',
				note: 'note',
				status: AttendanceStatus.NORMAL,
				late: 0,
				early_leave: 0,
				lack: 0,
				overtime: 0,
			},
		},
	})
	records: AttendanceRecords;

	@Prop({ type: Date })
	@IsDate()
	@ApiProperty({
		description: 'Ngày tháng',
		example: Date.now(),
	})
	@Transform(({ value }) => new Date(value))
	date: Date;

	@Prop({ type: String, required: false })
	@ApiProperty({
		description: 'Ảnh',
		example: 'https://example.com/image.jpg',
	})
	image: string;

	user: User;

	data: {
		time_checkin: string;
		time_checkout: string;
		total_time: number;
		late: number;
		early_leave: number;
		lack: number;
		overtime: number;
	};

	@Prop({ type: Types.ObjectId, ref: Task.name , required:false })
	@ApiProperty({
		description: 'Task',
		example: '66b1b1b1b1b1b1b1b1b1b1b1',
	})
	taskId?: Types.ObjectId;

	@Prop({ type: Types.ObjectId, ref: Holiday.name , required:false })
	@ApiProperty({
		description: 'Holiday',
		example: '66b1b1b1b1b1b1b1b1b1b1b1',
	})
	holidayId?: Types.ObjectId;
}
export const AttendanceSchema = SchemaFactory.createForClass(Attendance);
// unique mỗi ngày cho mỗi user
AttendanceSchema.index({ userId: 1, key: 1 }, { unique: true });
