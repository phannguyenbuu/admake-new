import { DocumentBase } from '@libs/common/base/document.base';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CustomerStatus } from './customer.enum';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';
import { ApiExtraModels } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

@Schema({ collection: 'customers', timestamps: true })
export class Customer extends DocumentBase {
	@Prop({ required: true, type: String })
	@IsString()
	@ApiProperty({
		description: 'Tên khách hàng',
		example: 'Nguyễn Văn A',
	})
	fullName: string;
    @Prop({ required: true, type: String, unique: true })
	@IsString()
	@ApiProperty({
		description: 'Số điện thoại',
		example: '0909090909',
	})
	phone: string;
	@Prop({ required: false, type: String })
	@IsString()
	@IsOptional()
	@ApiProperty({
		description: 'Thông tin công việc',
		example: 'Công việc 1',
		type: String,
	})
	workInfo: string;
	@Prop({ required: false, type: Date })
	@IsDate()
	@ApiProperty({
		description: 'Ngày bắt đầu công việc',
		example: Date.now(),
		type: Number,
	})
	@IsOptional()
	@Transform(({ value }) => (value ? new Date(value) : null))
	workStart: Date;
	@Prop({ required: false, type: Date })
	@IsDate()
	@ApiProperty({
		description: 'Ngày kết thúc công việc',
		example: Date.now(),
		type: Number,
	})
	@IsOptional()
	@Transform(({ value }) => (value ? new Date(value) : null))
	workEnd: Date;
	@Prop({ required: false, type: String })
	@IsString()
	@ApiProperty({
		description: 'Địa chỉ công việc',
		example: 'Địa chỉ 1',
	})
	@IsOptional()
	@Transform(({ value }) => (value ? value.toString() : null))
	workAddress: string;
	@Prop({ required: false, type: Number })
	@IsNumber()
	@ApiProperty({
		description: 'Giá công việc',
		example: 1000000,
	})
	@IsOptional()
	@IsNumber()
	@Min(0)
	@Transform(({ value }) => Number(value))
	workPrice: number;
	@Prop({ required: false, type: String, enum: CustomerStatus })
	@IsString()
	@ApiProperty({
		description: 'Trạng thái khách hàng',
		example: CustomerStatus.BOOKED,
	})
	@IsOptional()
	@IsEnum(CustomerStatus)
	status: CustomerStatus;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
