import { Module, OnModuleInit } from '@nestjs/common';
import { SettingService } from './setting.service';
import { SettingController } from './setting.controller';
import { SettingKey, SettingValueTypes } from './setting.enum';
import { Setting, SettingSchema } from './setting.entity';
import { Types } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
	imports: [MongooseModule.forFeature([{ name: Setting.name, schema: SettingSchema }])],
	controllers: [SettingController],
	providers: [SettingService],
	exports: [SettingService],
})
export class SettingModule implements OnModuleInit {
	constructor(private readonly settingService: SettingService) {}
	private readonly DEFAULT_SETTINGS: Partial<Setting<SettingKey>>[] = [
		{
			key: SettingKey.SALARY_LEVEL,
			value: [
				{
					id: new Types.ObjectId(),
					salary: 5_000_000,
					index: 1,
				},
				{
					id: new Types.ObjectId(),
					salary: 10_000_000,
					index: 2,
				},
				{
					id: new Types.ObjectId(),
					salary: 15_000_000,
					index: 3,
				},
				{
					id: new Types.ObjectId(),
					salary: 20_000_000,
					index: 4,
				},
			],
		},
		{
			key: SettingKey.SALARY_OVERTIME,
			value: 100_000,
		},
		{
			key: SettingKey.SALARY_OVERTIME_FIXED,
			value: 100_000,
		},
		{
			key: SettingKey.STANDARD_WORKING_DAYS,
			value: {
				'2025-08': {
					year: 2025,
					month: 8,
					days: 26,
				},
			},
		},
	];

	async onModuleInit() {
		for (const setting of this.DEFAULT_SETTINGS) {
			const existingSetting = await this.settingService.getSetting(setting.key as SettingKey);
			if (!existingSetting) {
				await this.settingService.create(setting);
			}
		}
	}
}
