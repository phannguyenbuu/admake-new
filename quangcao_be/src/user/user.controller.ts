import { Body, Controller, Delete, Get, Param, Post, Put, Query, UploadedFile } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiController, ApiFile, ApiModel, ApiNote, ApiPage } from '@libs/common/decorators/api.decorator';
import { PaginationDto } from '@libs/common/dto/pagination.dto';
import { User } from './user.entity';
import { UserCreateDto, UserUpdateDto } from './dto/user.dto';
import { UserPermission } from './user.enum';
import { RequirePermission } from '@libs/common/decorators/permission.decorator';
import { BufferFile } from '@libs/common/@types/utils';
import { FileUtil } from '@libs/common/utils/file.util';
import { ApiExtraModels } from '@nestjs/swagger';
import { ApiException } from '@libs/common/exception/api.exception';
import { IdDto } from '@libs/common/dto/id.dto';
@ApiController(User.path)
export class UserController {
	constructor(private readonly userService: UserService) {}

	@ApiPage(User)
	@ApiNote('Lấy danh sách người dùng theo trang')
	@Get()
	async findAll(@Query() dto: PaginationDto) {
		return this.userService.findPage(dto, ['username', 'fullName', 'phone']);
	}

	@ApiModel(User)
	@ApiNote('Tạo người dùng')
	@Post()
	@ApiFile('avatar')
	@RequirePermission(UserPermission.USER_MANAGEMENT)
	async create(@Body() dto: UserCreateDto, @UploadedFile() avatar: BufferFile) {
		await this.userService.findByUsername(dto.username).exists(ApiException.USER_ALREADY_EXISTS);
		if (avatar) {
			dto.avatar = await FileUtil.SaveFileBuffer(avatar, {
				randomName: true,
				destination: User.path,
			});
		}
		return this.userService.create(dto);
	}

	@ApiModel(User)
	@ApiNote('Cập nhật người dùng')
	@Put(':id')
	@ApiFile('avatar')
	@RequirePermission(UserPermission.USER_MANAGEMENT)
	async update(@Param('id') id: string, @Body() dto: UserUpdateDto, @UploadedFile() avatar: BufferFile) {
		if (avatar) {
			dto.avatar = await FileUtil.SaveFileBuffer(avatar, {
				randomName: true,
				destination: User.path,
			});
		}
		return this.userService.model.findByIdAndUpdate(id, dto, { new: true });
	}

	@ApiModel(User)
	@ApiNote('Xóa người dùng')
	@Delete(':id')
	@RequirePermission(UserPermission.USER_MANAGEMENT)
	async delete(@Param() dto: IdDto) {
		const user = await this.userService.findById(dto.id).orThrow(ApiException.USER_NOT_FOUND);
		if (user.avatar) {
			try {
				await FileUtil.RemoveFile(user.avatar);
			} catch (error) {}
		}
		return this.userService.softDelete(user._id);
	}

	@Get(':id')
	async findById(@Param() dto: IdDto) {
		return this.userService.findById(dto.id).orThrow(ApiException.USER_NOT_FOUND);
	}
}
