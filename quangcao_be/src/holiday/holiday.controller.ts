import { Body, Controller, Get, Post, Put, Delete, Param, Query } from '@nestjs/common';
import { HolidayService } from './holiday.service';
import { Holiday } from './holiday.entity';
import { ApiController, ApiModel, ApiNote } from '@libs/common/decorators/api.decorator';
import { AuthService } from 'src/auth/auth.service';
import { CreateHolidayDto, UpdateHolidayDto, HolidayResponseDto } from './dto/holiday.dto';
import { IdDto } from '@libs/common/dto/id.dto';
import { HolidayType } from './holiday.enum';
import { UserPermission } from 'src/user/user.enum';
import { RequirePermission } from '@libs/common/decorators/permission.decorator';
import { PaginationDto } from '@libs/common/dto/pagination.dto';
import { Types } from 'mongoose';

@ApiController(Holiday.path)
@RequirePermission(UserPermission.USER_MANAGEMENT)
export class HolidayController {
	constructor(
		private readonly holidayService: HolidayService,
		private readonly authService: AuthService,
	) {}

    @Get("/forUser/:id")
	@ApiNote('Lấy danh sách ngày nghỉ của người dùng')	
	@ApiModel(HolidayResponseDto)
	async getMyHolidays(@Query() query: PaginationDto, @Param() param: IdDto) {
		return await this.holidayService.findPage(query, ['name', 'description'], {
			forUserId: new Types.ObjectId(param.id),
			type: HolidayType.PERSONAL_LEAVE,
		}, {
			createdAt: 'asc',
		});
	}	

	@Post()
	@ApiNote('Tạo ngày nghỉ mới')
	@ApiModel(HolidayResponseDto)
	@RequirePermission(UserPermission.USER_MANAGEMENT)
	async createHoliday(@Body() data: CreateHolidayDto) {
		const user = await this.authService.currentUser();
		return await this.holidayService.createHoliday(data, user);
	}

	@Get(':id')
	@ApiNote('Lấy thông tin ngày nghỉ theo ID')
	@ApiModel(HolidayResponseDto)
	async getHolidayById(@Param() param: IdDto) {
		return await this.holidayService.findById(param.id.toString());
	}

	@Put(':id')
	@ApiNote('Cập nhật ngày nghỉ')
	@ApiModel(HolidayResponseDto)
	@RequirePermission(UserPermission.USER_MANAGEMENT)
	async updateHoliday(@Param() param: IdDto, @Body() data: UpdateHolidayDto) {
		const user = await this.authService.currentUser();
		return await this.holidayService.updateHoliday(param.id.toString(), data, user);
	}

	@Delete(':id')
	@ApiNote('Xóa ngày nghỉ')
	@RequirePermission(UserPermission.USER_MANAGEMENT)
	async deleteHoliday(@Param() param: IdDto) {
		return await this.holidayService.softDelete(param.id.toString());
	}
} 