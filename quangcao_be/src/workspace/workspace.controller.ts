import { Body, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { ApiController, ApiModel, ApiNote } from '@libs/common/decorators/api.decorator';
import { WorkspaceCreateDto } from './dto/workspace.dto';
import { AuthService } from 'src/auth/auth.service';
import { Workspace } from './workspace.entity';
import { IdDto } from '@libs/common/dto/id.dto';
import { ApiException } from '@libs/common/exception/api.exception';
import { Task } from 'src/task/task.entity';
import { TaskService } from 'src/task/task.service';
import { RequirePermission } from '@libs/common/decorators/permission.decorator';
import { UserPermission } from 'src/user/user.enum';

@ApiController('workspace')
export class WorkspaceController {
	constructor(
		private readonly workspaceService: WorkspaceService,
		private readonly authService: AuthService,
		private readonly taskService: TaskService,
	) {}

	@Post()
	@ApiNote('Tạo workspace')
	@RequirePermission(UserPermission.WORK_MANAGEMENT)
	async create(@Body() dto: WorkspaceCreateDto) {
		const user = await this.authService.currentUser();
		await this.workspaceService.findOne({ name: dto.name }).exists(ApiException.WORKSPACE_ALREADY_EXISTS);
		return await this.workspaceService.create({
			name: dto.name,
			ownerId: user._id,
		});
	}

	@Get()
	@ApiNote('Lấy danh sách workspace')
	@ApiModel([Workspace])
	
	async getWorkspaces() {
		return await this.workspaceService.findAll();
	}

	@Get(':id/tasks')
	@ApiNote('Lấy danh sách task của workspace')
	@ApiModel([Task])
	async getTasks(@Param() dto: IdDto) {
		return await this.taskService.groupByStatus(dto.id);
	}

	@Get(':id')
	@ApiNote('Lấy workspace theo id')
	@ApiModel(Workspace)
	async getWorkspace(@Param() dto: IdDto) {
		return await this.workspaceService.findById(dto.id).orThrow(ApiException.WORKSPACE_NOT_FOUND);
	}

	@Put(':id')
	@ApiNote('Cập nhật workspace')
	@RequirePermission(UserPermission.WORK_MANAGEMENT)
	@ApiModel(Workspace)
	async updateWorkspace(@Param() dto: IdDto, @Body() body: WorkspaceCreateDto) {
		const workspace = await this.workspaceService.findById(dto.id).orThrow(ApiException.WORKSPACE_NOT_FOUND);
		return await this.workspaceService.model.findByIdAndUpdate(workspace._id, body, { new: true });
	}

	@Delete(':id')
	@ApiNote('Xóa workspace')
	@RequirePermission(UserPermission.WORK_MANAGEMENT)
	async deleteWorkspace(@Param() dto: IdDto) {
		const workspace = await this.workspaceService.findById(dto.id).orThrow(ApiException.WORKSPACE_NOT_FOUND);
		return this.workspaceService.softDelete(workspace._id);
	}
}
