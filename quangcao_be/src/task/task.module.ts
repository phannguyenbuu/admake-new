import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Task, TaskSchema } from './task.entity';
import { TaskController } from './task.controller';
import { CommentModule } from 'src/comment/comment.module';
import { AttendanceModule } from 'src/attendance/attendance.module';
import { NotificationModule } from 'src/notification/notification.module';
import { MaterialModule } from 'src/material/material.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
		CommentModule,
		AttendanceModule,
		NotificationModule,
		MaterialModule,
	],
	controllers: [TaskController],
	providers: [TaskService],
	exports: [TaskService],
})
export class TaskModule {}
