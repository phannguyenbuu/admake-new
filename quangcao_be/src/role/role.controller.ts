import { Get, Param, Post, Put, Delete, Body } from '@nestjs/common';
import { RoleService } from './role.service';
import { Role } from './role.entity';
import { UserPermission, UserPermissionLabel } from 'src/user/user.enum';
import { ApiController, ApiNote } from '@libs/common/decorators/api.decorator';
import { RoleCreateDto, RoleUpdateDto } from './dto/role.dto';
import { RequirePermission } from '@libs/common/decorators/permission.decorator';
import { IdDto } from '@libs/common/dto/id.dto';
import { ApiException } from '@libs/common/exception/api.exception';

@ApiController(Role.path)

export class RoleController {
	constructor(private readonly roleService: RoleService) {}

	@Get('/')
	@ApiNote('Lấy danh sách vai trò')
	async findAll() {
		return this.roleService.model.find();
	}

	@Get('/:id')
	@ApiNote('Lấy vai trò theo id')
	async findById(@Param() dto: IdDto) {
		return this.roleService.findById(dto.id).orThrow(ApiException.ROLE_NOT_FOUND);
	}

	@Post('/')
	@ApiNote('Tạo vai trò')
	@RequirePermission(UserPermission.ROLE_MANAGEMENT)
	async create(@Body() body: RoleCreateDto) {
		return this.roleService.create(body);
	}

	@Put('/:id')
	@ApiNote('Cập nhật vai trò')
	@RequirePermission(UserPermission.ROLE_MANAGEMENT)
	async update(@Param() dto: IdDto, @Body() body: RoleUpdateDto) {
		await this.roleService.findById(dto.id).orThrow(ApiException.ROLE_NOT_FOUND);
		return this.roleService.model.findByIdAndUpdate(dto.id, body, { new: true });
	}

	@Delete('/:id')
	@ApiNote('Xóa vai trò')
	@RequirePermission(UserPermission.ROLE_MANAGEMENT)
	async delete(@Param() dto: IdDto) {
		const role = await this.roleService.findById(dto.id).orThrow(ApiException.ROLE_NOT_FOUND);

		return this.roleService.softDelete(role._id);
	}

	@Get('/list/permission')
	@ApiNote('Lấy danh sách quyền')
	listPermission() {
		return Object.keys(UserPermissionLabel).map((key) => ({
			value: key,
			label: UserPermissionLabel[key],
		}));
	}

	@Get('/list/all')
	@ApiNote('Lấy danh sách vai trò')
	async list() {
		return this.roleService.findAll();
	}
}
