import { Body, Get, Put } from '@nestjs/common';
import { SettingService } from './setting.service';
import { SettingKey, settingValueValidator } from './setting.enum';
import { ApiController, ApiNote } from '@libs/common/decorators/api.decorator';
import { ApiException } from '@libs/common/exception/api.exception';
import { SettingDto, UpdateStandardWorkingDaysDto } from './dto/setting.dto';
import { Setting } from './setting.entity';
import { UserPermission } from 'src/user/user.enum';
import { RequirePermission } from '@libs/common/decorators/permission.decorator';
import { Types } from 'mongoose';
import { StringUtil } from '@libs/common/utils/string.util';
@ApiController(Setting.path)

export class SettingController {
	constructor(private readonly settingService: SettingService) {}

	@Get('get-setting')
	@ApiNote('Lấy cấu hình')
	async getSetting() {
		return this.settingService.model.find({});
	}

	@Put('update-setting')
	@ApiNote('Cập nhật cấu hình')
	@RequirePermission(UserPermission.SETTING_MANAGEMENT)
	async updateSetting(@Body() body: SettingDto) {
		if (!settingValueValidator[body.key](body.value)) {
			throw ApiException.SETTING_INVALID;
		}

		if (body.key === SettingKey.SALARY_LEVEL) {
			let raw = body.value as { id?: Types.ObjectId; salary: number; index: number }[];
			const rawBody = raw.map((item, index) => ({
				...item,
				index: index + 1,
				id: item.id || new Types.ObjectId(),
			}));
			return this.settingService.updateSetting(body.key, rawBody);
		}
		return this.settingService.updateSetting(body.key, body.value);
	}

	@Put('update-standard-working-days')
	@ApiNote('Cập nhật số ngày làm việc chuẩn')
	@RequirePermission(UserPermission.SETTING_MANAGEMENT)
	async updateStandardWorkingDays(@Body() body: UpdateStandardWorkingDaysDto) {
		let standardWorkingDays = await this.settingService.getSettingType<Record<string, {
			year: number;
			month: number;
			days: number;
		}>>(SettingKey.STANDARD_WORKING_DAYS);
		standardWorkingDays[`${body.year}-${StringUtil.padLeft(body.month, 2)}`] = {
			year: body.year,
			month: body.month,
			days: body.standardWorkingDays,
		};
		return this.settingService.updateSetting(SettingKey.STANDARD_WORKING_DAYS, standardWorkingDays);
	}
}
