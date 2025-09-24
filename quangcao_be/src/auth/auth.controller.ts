import { Body, Controller, forwardRef, Get, Inject, Post, Put, UploadedFile } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiController, ApiFile, ApiModel, ApiNote, ApiPublic } from '@libs/common/decorators/api.decorator';
import { ApiBody, ApiOperation, ApiResponse, PickType } from '@nestjs/swagger';
import { User } from 'src/user/user.entity';
import { LoginDto } from './dto/auth.dto';
import { AuthModel } from './models/auth.model';
import { UserUpdateDto, UserUpdateMeAvatarDto, UserUpdateMeDto } from 'src/user/dto/user.dto';
import { BufferFile } from '@libs/common/@types/utils';
import { FileUtil } from '@libs/common/utils/file.util';
import { UserService } from 'src/user/user.service';
import { ReportService } from 'src/report/report.service';
import { OnEvent } from '@nestjs/event-emitter';

@ApiController('auth')
export class AuthController {
	constructor(
		private readonly authService: AuthService,
	) {}

	static data:Record<string,Awaited<ReturnType<ReportService['getAttendanceReport']>>[number]> = {};
	
	
	@Post('login')
	@ApiNote('Đăng nhập')
	@ApiBody({ type: LoginDto })
	@ApiPublic()
	@ApiResponse({ type: AuthModel })
	async login(@Body() dto: LoginDto) {
		return this.authService.login(dto);
	}

	@Get('/me') 
	@ApiNote('Lấy thông tin người dùng hiện tại') 
	@ApiResponse({ type: User })
	async me() {
		const r = await this.authService.currentUser();
		console.log(AuthController.data);
		return{
			...r.toJSON(),
			total_salary:AuthController.data[r._id?.toString() ?? '']?.total_salary ?? 0,
		}
	}

	@Put('/me')
	@ApiNote('Cập nhật thông tin người dùng')
	@ApiResponse({ type: User })
	async updateMe(@Body() dto: UserUpdateMeDto) {
		const user = await this.authService.currentUser();
		user.fullName = dto.fullName ?? user.fullName;
		user.phone = dto.phone ?? user.phone;
		user.password = dto.password ?? user.password;
		return await user.save();
	}

	@Put('/me/avatar')
	@ApiNote('Cập nhật ảnh đại diện')
	@ApiResponse({ type: User })
	@ApiFile("avatar")
	async updateMeAvatar(@Body() dto: UserUpdateMeAvatarDto, @UploadedFile() avatar: BufferFile) {
		const user = await this.authService.currentUser();
		if (avatar) {
			const imagePath = await FileUtil.SaveFileBuffer(avatar, {
				randomName: true,
				destination: User.path,
			});
			dto.avatar = imagePath;
		}
		user.avatar = dto.avatar ?? user.avatar;
		return await user.save();
	}
}
