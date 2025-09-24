import { ApiController, ApiFile, ApiModel, ApiNote } from '@libs/common/decorators/api.decorator';

import { TaskService } from './task.service';
import { Task } from './task.entity';
import { TaskCreateDto, TaskStatusDto, TaskUpdateDto } from './dto/task.dto';
import { IdDto } from '@libs/common/dto/id.dto';
import { Body, Delete, Get, Param, Post, Put, Query, UploadedFile } from '@nestjs/common';
import { ApiException } from '@libs/common/exception/api.exception';
import { AuthService } from 'src/auth/auth.service';
import { PaginationDto } from '@libs/common/dto/pagination.dto';
import { CommentService } from 'src/comment/comment.service';
import { CreateCommentDto } from 'src/comment/dto/comment.dto';
import { Comment } from 'src/comment/comment.entity';
import { BufferFile } from '@libs/common/@types/utils';
import { FileUtil } from '@libs/common/utils/file.util';
import { AttendanceCheckDto } from 'src/attendance/dto/attendance.dto';
import { AttendanceService } from 'src/attendance/attendance.service';
import { Types } from 'mongoose';
import { NotificationService } from 'src/notification/notification.service';
import { TaskStatus } from './task.enum';
import { MaterialService } from 'src/material/material.service';
import { RequirePermission } from '@libs/common/decorators/permission.decorator';
import { UserPermission } from 'src/user/user.enum';
import * as dayjs from 'dayjs';
import { AttendanceType } from 'src/attendance/attendance.enum';
@ApiController(Task.path)
export class TaskController {
	constructor(
		private readonly taskService: TaskService,
		private readonly authService: AuthService,
		private readonly commentService: CommentService,
		private readonly attendanceService: AttendanceService,
		private readonly notificationService: NotificationService,
		private readonly materialService: MaterialService
	) {}

	@Get('/:id')
	@ApiNote('Lấy task theo id')
	@ApiModel(Task)
	async getTask(@Param() dto: IdDto) {
		return this.taskService.getDetail(dto).orThrow(ApiException.TASK_NOT_FOUND);
	}

	@Post()
	@ApiNote('Tạo task')
	@ApiModel(Task)
	@RequirePermission(UserPermission.WORK_MANAGEMENT)
	async createTask(@Body() dto: TaskCreateDto) {
		const user = await this.authService.currentUser();
		// CHECK MATERIALS QUANTITY ĐỦ ĐỂ TẠO TASK KHÔNG
		const materials = await this.materialService.findAll({ _id: { $in: dto.materials.map(m => m.materialId) } });
		for (const material of materials) {
			const materialDto = dto.materials.find(m => m.materialId.toString() === material._id.toString());
			if(!materialDto) {
				throw ApiException.MATERIAL_NOT_FOUND;
			}
			if(material.quantity < materialDto.quantity) {
				throw ApiException.TASK_MATERIAL_NOT_ENOUGH;
			}
		}
		// UPDATE MATERIALS QUANTITY
		for (const material of materials) {
			const materialDto = dto.materials.find(m => m.materialId.toString() === material._id.toString());
			if(!materialDto) {
				throw ApiException.MATERIAL_NOT_FOUND;
			}
			await this.materialService.model.findByIdAndUpdate(material._id, { $inc: { quantity: -materialDto.quantity } });
		}
		const task = await this.taskService.createTask(dto, user);
		const taskDetail = await this.taskService.getDetail({ id: task._id });
		await this.notificationService.createTaskNoti(taskDetail);
		return taskDetail;
	}

	@Put('/:id')
	@ApiNote('Cập nhật task')
	@ApiModel(Task)
	@RequirePermission(UserPermission.WORK_MANAGEMENT)
	async updateTask(@Param() dto: IdDto, @Body() body: TaskUpdateDto) {
		const task = await this.taskService.findById(dto.id).orThrow(ApiException.TASK_NOT_FOUND);
		if(task.status === TaskStatus.REWARD) {
			throw ApiException.TASK_REWARD_NOT_FOUND;
		}
		return this.taskService.updateTask(dto, body).orThrow(ApiException.TASK_NOT_FOUND);
	}

	@Post('/:id/check')
	@ApiNote('Check in/out trực tiếp trên task')
	@ApiFile('image')
	async checkAttendance(@Body() body: AttendanceCheckDto, @UploadedFile() image: BufferFile, @Param() dto: IdDto) {
		const user = await this.authService.currentUser();
		const task = await this.taskService.findById(dto.id).orThrow(ApiException.TASK_NOT_FOUND);
		if(!image)
		{
			throw ApiException.IMAGE_REQUIRED;
		}
		const imagePath = await FileUtil.SaveFileBuffer(image, {
			randomName: true,
			destination: Task.path,
		});
		const attendance = await this.attendanceService.checkAttendance(user, body, imagePath, task._id);
		const comment = await this.commentService.create({	
			content: `Đã check ${body.type === AttendanceType.IN ? 'vào' : 'ra'} lúc ${dayjs(new Date()).format('HH:mm:ss DD/MM/YYYY')}`,
			createById: user._id,
			attendanceId: attendance?._id,
			taskId: task._id,
			image: imagePath,
			type:body.type
		});
		return this.commentService.getDetail(comment._id).orThrow(ApiException.COMMENT_NOT_FOUND);
	}

	@Put('/:id/status')
	@ApiNote('Cập nhật status task')
	@ApiModel(Task)
	@RequirePermission(UserPermission.WORK_MANAGEMENT)
	async updateTaskStatus(@Param() dto: IdDto, @Body() body: TaskStatusDto) {
		const task = await this.taskService.findById(dto.id).orThrow(ApiException.TASK_NOT_FOUND);
		if(task.status == TaskStatus.REWARD ) {
			throw ApiException.TASK_REWARD_NOT_FOUND;
		}
		if(body.status == TaskStatus.REWARD) {
			return this.taskService.updateTask(dto, {
				...body,
				confirmDate: new Date(),
			}).orThrow(ApiException.TASK_NOT_FOUND);
		}
		return await this.taskService
			.model.findByIdAndUpdate(dto.id, {status: body.status}, { new: true })
			.orFail(ApiException.TASK_NOT_FOUND);
	}

	@Delete('/:id')
	@ApiNote('Xóa task')
	@ApiModel(Task)
	@RequirePermission(UserPermission.WORK_MANAGEMENT)
	async deleteTask(@Param() dto: IdDto) {
		return this.taskService.softDelete(dto.id);
	}

	@Post('/:id/comment')
	@ApiNote('Tạo comment')
	@ApiModel(Comment)
	@ApiFile('image')
	async createComment(@Param() dto: IdDto, @Body() body: CreateCommentDto, @UploadedFile() image: BufferFile) {
		const task = await this.taskService.findById(dto.id).orThrow(ApiException.TASK_NOT_FOUND);
		const user = await this.authService.currentUser();
		let imageUrl: string | null = null;
		if (image) {
			imageUrl = await FileUtil.SaveFileBuffer(image, {
				randomName: true,
				destination: Comment.path,
			});
		}
		const comment = await this.commentService.create({
			...body,
			createById: user._id,
			taskId: task._id,
			image: imageUrl ?? undefined,
			
		});
		return this.commentService.getDetail(comment._id).orThrow(ApiException.COMMENT_NOT_FOUND);
	}

	@Get('/:id/comment')
	@ApiNote('Lấy comment')
	@ApiModel(Comment)
	async getComment(@Param() dto: IdDto, @Query() query: PaginationDto) {
		return this.commentService.list({ taskId: dto.id }, query);
	}
}
