import { IsEnum, IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';
import { AttendanceType } from '../attendance.enum';
import { DateQueryDto } from '@libs/common/dto/date.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Types } from 'mongoose';
import { IsMongoIdObject } from '@libs/common/validators/isMongoIdObject.val';

export class AttendanceCheckDto {
	@IsOptional()
	@IsNumber()
	@Transform(({ value }) => parseFloat(value))
	longitude?: number;

	@IsOptional()
	@IsNumber()
	@Transform(({ value }) => parseFloat(value))
	latitude?: number;

	@IsOptional()
	@IsString()
	ssid?: string;

	@IsOptional()
	@IsString()
	bssid?: string;

	@IsOptional()
	@IsString()
	note?: string;

	@IsEnum(AttendanceType)
	type: AttendanceType; // Phân biệt checkin hay checkout

	@ApiProperty({
		description: 'Ảnh',
		format: 'binary',
		type: 'string',
		required: false,
	})
	@IsOptional()
	image?: string;
}

export class AttendanceReportDto extends DateQueryDto {}


export class AttendanceGetByKeyDto {
	@IsString()
	@ApiProperty({
		description: 'Key của chấm công',
		example: '20250821',
	})
	key: string;

	@IsMongoIdObject()
	@ApiProperty({
		description: 'ID của người dùng',
		example: '60a99f8b8b8b8b8b8b8b8b8b',
		type:String
	})
	userId: Types.ObjectId;
}