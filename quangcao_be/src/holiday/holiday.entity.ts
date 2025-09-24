import { DocumentBase } from '@libs/common/base/document.base';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { User } from 'src/user/user.entity';
import { IsDate, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsMongoIdObject } from '@libs/common/validators/isMongoIdObject.val';

export enum HolidayType {
	PUBLIC_HOLIDAY = 'PUBLIC_HOLIDAY',
	COMPANY_HOLIDAY = 'COMPANY_HOLIDAY',
	PERSONAL_LEAVE = 'PERSONAL_LEAVE',
	SICK_LEAVE = 'SICK_LEAVE',
	ANNUAL_LEAVE = 'ANNUAL_LEAVE',
	OTHER = 'OTHER',
}

@Schema({
	timestamps: true,
})
export class Holiday extends DocumentBase {
	@Prop({ type: String, required: true })
	@IsString()
	@ApiProperty({
		description: 'Tên ngày nghỉ',
		example: 'Tết Nguyên Đán',
	})
	name: string;

	@Prop({ type: Date, required: true })
	@IsDate()
	@ApiProperty({
		description: 'Ngày bắt đầu',
		example: new Date('2024-02-10').getTime(),
		type: 'number',
	})
	@Transform(({ value }) => new Date(value))
	
	startDate: Date;

	@Prop({ type: Date, required: true })
	@IsDate()
	@ApiProperty({
		description: 'Ngày kết thúc',
		example: new Date('2024-02-14').getTime(),
		type: 'number',
	})
	@Transform(({ value }) => new Date(value))
	endDate: Date;

	@Prop({ type: String, enum: HolidayType, default: HolidayType.PUBLIC_HOLIDAY })
	@IsEnum(HolidayType)
	@ApiProperty({
		description: 'Loại ngày nghỉ',
		enum: HolidayType,
		example: HolidayType.PUBLIC_HOLIDAY,
	})
	type: HolidayType;

	@Prop({ type: String, required: false })
	@IsOptional()
	@IsString()
	@ApiProperty({
		description: 'Mô tả',
		example: 'Nghỉ Tết Nguyên Đán 2024',
	})
	description: string;

	@Prop({ type: Types.ObjectId, ref: User.name, required: false })
	@IsOptional()
	@ApiProperty({
		description: 'Người tạo',
		example: '507f1f77bcf86cd799439011',
	})
	createdBy: Types.ObjectId;
	
	@Prop({ type: Types.ObjectId, ref: User.name, required: false })
	@IsOptional()
	@ApiProperty({
		description: 'Người dùng nghỉ',
		example: '507f1f77bcf86cd799439011',
	})
	@IsMongoIdObject()
	@Transform(({ value }: { value: string }) => new Types.ObjectId(value))
	forUserId: Types.ObjectId;

	@Prop({ type: Boolean, default: true })
	@ApiProperty({
		description: 'Trạng thái hoạt động',
		example: true,
	})
	isActive: boolean;

	@Prop({ type: Number, required: false })
	@IsOptional()
	@ApiProperty({
		description: 'Số ngày nghỉ',
		example: 5,
	})
	daysCount: number;

	user: User;
}

export const HolidaySchema = SchemaFactory.createForClass(Holiday); 