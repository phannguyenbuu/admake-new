import { DocumentBase } from '@libs/common/base/document.base';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { User } from 'src/user/user.entity';
import { Task } from 'src/task/task.entity';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Attendance } from 'src/attendance/attendance.entity';
import { AttendanceType } from 'src/attendance/attendance.enum';


@Schema({
	timestamps: true,
})
export class Comment extends DocumentBase {
	@Prop({ type: Types.ObjectId, ref: User.name, default: null })
	@IsOptional()
	@ApiProperty({
		description: 'Id của user',
		example: '60a0a0a0a0a0a0a0a0a0a0a0',
	})
	createById: Types.ObjectId;

	@Prop({ type: Types.ObjectId, ref: Attendance.name, default: null })
	@IsOptional()
	@ApiProperty({
		description: 'Id của attendance',
		example: '60a0a0a0a0a0a0a0a0a0a0a0',
	})
	attendanceId: Types.ObjectId;

	@ApiProperty({
		description: 'User',
		type: User,
	})
	@Type(() => User)
	createBy: User;

	@Prop({ type: String, default: null })
	@IsString()
	@IsOptional()
	@ApiProperty({
		description: 'Nội dung comment',
		example: 'Comment 1',
	})
	content: string;

	@Prop({ type: String, default: null })
	@IsString()
	@IsOptional()
	@ApiProperty({
		description: 'Ảnh comment',
		type: 'string',
		format: 'binary',
		required: false,
	})
	image: string;

	@Prop({ type: Types.ObjectId, ref: Task.name })
	@ApiProperty({
		description: 'Id của task',
		example: '60a0a0a0a0a0a0a0a0a0a0a0',
	})
	taskId: Types.ObjectId;

	@ApiProperty({
		description: 'Task',
		type: Task,
	})
	@Type(() => Task)
	task: Task;

	@Prop({ type: String, default: null })
	@IsString()
	@IsOptional()
	@ApiProperty({
		description: 'Loại comment',
		example: AttendanceType.IN,
	})
	type: AttendanceType;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
