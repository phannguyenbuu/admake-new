import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Setting } from './setting.entity';
import { SettingKey, SettingValueTypes } from './setting.enum';
import { ServiceBase } from '@libs/common/base/service.base';
import { StringUtil } from '@libs/common/utils/string.util';

@Injectable()
export class SettingService extends ServiceBase<Setting<SettingKey>> {
	constructor(@InjectModel(Setting.name) settingModel: Model<Setting<SettingKey>>) {
		super(settingModel);
	}

	async getSetting(key: SettingKey) {
		return this.model.findOne({ key });
	}

	async getSettingType<T extends SettingValueTypes[SettingKey]>(key: SettingKey) {
		const setting = await this.model.findOne({ key });
		return setting?.value as T;
	}

	async updateSetting(key: SettingKey, value: SettingValueTypes[SettingKey]) {
		return this.model.findOneAndUpdate({ key }, { value }, { new: true });
	}

	// lấy số ngày công chuẩn
	async getStandardWorkingDays(year: number, month: number) {
		const setting = await this.getSetting(SettingKey.STANDARD_WORKING_DAYS);
		return setting?.value[`${year}-${StringUtil.padLeft(month, 2)}`]?.days || 26;
	}
}
