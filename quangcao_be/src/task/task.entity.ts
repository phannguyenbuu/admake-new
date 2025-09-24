import { DocumentBase } from '@libs/common/base/document.base';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { TaskStatus, TaskType } from './task.enum';
import { Workspace } from 'src/workspace/workspace.entity';
import { Types } from 'mongoose';
import { User } from 'src/user/user.entity';
import { Customer } from 'src/customer/customer.entity';
import { TaskMaterial } from './task.type';
import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDate, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { IsMongoIdObject } from '@libs/common/validators/isMongoIdObject.val';

@Schema({
	timestamps: true,
})
@ApiExtraModels(TaskMaterial, User, Workspace, Customer)
export class Task extends DocumentBase {
	@Prop({ type: String })
	@ApiProperty({
		description: 'Tiêu đề của task',
		example: 'Task 1',
	})
	@IsString()
	title: string;

	@Prop({ type: String, required: false })
	@ApiProperty({
		description: 'Mô tả của task',
		example: 'Mô tả task 1',
	})
	@IsString()
	@IsOptional()
	description: string;

	@Prop({ type: String, enum: TaskStatus, default: TaskStatus.OPEN })
	@ApiProperty({
		description: 'Trạng thái của task',
		example: TaskStatus.OPEN,
	})
	@IsEnum(TaskStatus)
	@IsOptional()
	status: TaskStatus;

	@Prop({ type: String, enum: TaskType, default: TaskType.REWARD })
	@ApiProperty({
		description: 'Loại của task',
		example: TaskType.REWARD,
	})
	@IsEnum(TaskType)
	@IsOptional()
	type: TaskType;

	@Prop({ type: Number, default: 0 })
	@ApiProperty({
		description: 'Số tiền thưởng của task',
		example: 100000,
	})
	@IsNumber()
	@IsOptional()
	reward: number;

	@Prop({ type: [Types.ObjectId], ref: User.name })
	@ApiProperty({
		description: 'Id của người thực hiện task',
		example: ['60a0a0a0a0a0a0a0a0a0a0a0'],
	})
	@IsArray()
	@IsMongoIdObject()
	@IsOptional()
	@Transform(({ value }: { value: string[] }) => value.map((id: string) => new Types.ObjectId(id)))
	assignIds: Types.ObjectId[];

	@ApiProperty({
		description: 'Người thực hiện task',
		type: [User],
	})
	assigns: User[];

	@Prop({ type: Types.ObjectId, ref: Workspace.name })
	@ApiProperty({
		description: 'Id của workspace',
		example: '60a0a0a0a0a0a0a0a0a0a0a0',
	})
	@IsMongoIdObject()
	@Transform(({ value }: { value: string }) => new Types.ObjectId(value))
	workspaceId: Types.ObjectId;

	@ApiProperty({
		description: 'Workspace',
		type: Workspace,
	})
	workspace: Workspace;

	@Prop({ type: Types.ObjectId })
	@ApiProperty({
		description: 'Id của khách hàng',
		example: '60a0a0a0a0a0a0a0a0a0a0a0',
	})
	@IsMongoIdObject()
	@Transform(({ value }: { value: string }) => new Types.ObjectId(value))
	customerId: Types.ObjectId;

	@ApiProperty({
		description: 'Khách hàng',
		type: Customer,
	})
	customer: Customer;

	@Prop({ type: Types.ObjectId, ref: User.name })
	@ApiProperty({
		description: 'Id của người tạo task',
		example: '60a0a0a0a0a0a0a0a0a0a0a0',
	})
	@Transform(({ value }: { value: string }) => new Types.ObjectId(value))
	createById: Types.ObjectId;

	@ApiProperty({
		description: 'Người tạo task',
		type: User,
	})
	createBy: User;

	@Prop({ type: [TaskMaterial], required: false, default: [] })
	@ApiProperty({
		description: 'Vật tư của task',
		type: [TaskMaterial],
	})
	@IsArray()
	@IsOptional()
	@ValidateNested({ each: true })
	@Type(() => TaskMaterial)
	materials: TaskMaterial[];
	
	@Prop({ type:Date, required: false })
	@ApiProperty({
		description: 'Ngày bắt đầu của task',
		example: Date.now(),
		type:Number,
	})
	@IsDate()
	@IsOptional()
	@Transform(({ value }: { value: Date }) => new Date(value))
	startTime: Date;

	@Prop({ type: Date, required: false })
	@ApiProperty({
		type:Number,
		description: 'Ngày kết thúc của task',
		example: Date.now(),
	})
	@IsDate()
	@IsOptional()
	@Transform(({ value }: { value: Date }) => new Date(value))
	endTime: Date;

	// đã thanh toán tiền  
	@Prop({ type: Boolean, default: false })
	@ApiProperty({
		description: 'Đã thanh toán tiền',
		example: false,
	})
	@IsBoolean()
	@IsOptional()	
	paid: boolean;

	// ngày xác nhận nghiệm thu
	@Prop({ type: Date, required: false })
	@ApiProperty({
		description: 'Ngày xác nhận nghiệm thu',
		example: Date.now(),
	})
	@IsDate()
	@IsOptional()
	@Transform(({ value }: { value: Date }) => new Date(value))
	confirmDate: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
