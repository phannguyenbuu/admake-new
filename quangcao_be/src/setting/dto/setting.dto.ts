import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { SettingKey, SettingValueTypes } from '../setting.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class SettingDto {
	@IsEnum(SettingKey)
	@ApiProperty({
		enum: SettingKey,
		description: 'Cấu hình',
		example: SettingKey.SALARY_LEVEL,
	})
	key: SettingKey;
	@IsNotEmpty()
	@ApiProperty({
		description: 'Giá trị',
		example: {
			id: new Types.ObjectId(),
			salary: 1000000,
			index: 1,
		},
	})
	value: SettingValueTypes[SettingKey];
}


export class UpdateStandardWorkingDaysDto {
	@IsNumber()
	@ApiProperty({
		description: 'Số ngày làm việc chuẩn',
		example: 26,
	})
	standardWorkingDays: number;

	@IsNumber()
	@ApiProperty({
		description: 'Năm',
		example: 2025,
	})
	year: number;

	@IsNumber()
	@ApiProperty({
		description: 'Tháng',
		example: 1,
	})
	month: number;
}