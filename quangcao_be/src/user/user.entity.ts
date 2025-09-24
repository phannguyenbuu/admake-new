import { DocumentBase } from '@libs/common/base/document.base';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { UserStatus, UserType } from './user.enum';
import { Exclude, Transform } from 'class-transformer';
import * as crypto from 'crypto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { Role } from 'src/role/role.entity';
import { Types } from 'mongoose';
import { IsMongoIdObject } from '@libs/common/validators/isMongoIdObject.val';

@Schema({
	collection: 'users',
	timestamps: true,
	toJSON: {
		transform: (_, ret) => {
			delete ret.password;
			delete ret.hashKey;
			return ret;
		},
	},
})
export class User extends DocumentBase {
    @Prop({ required: true, trim: true, match: /^[a-zA-Z0-9]+$/, unique: true })
	@ApiProperty({ description: 'Username', example: 'tuannc' })
	@IsString()
	@IsNotEmpty()
	@Transform(({ value }) => value.trim())
	@Matches(/^[a-zA-Z0-9]+$/)
	username: string;

	@Prop({ required: true })
	@Exclude({ toPlainOnly: true })
	@ApiProperty({ description: 'Password', example: '123@Tuan' })
	@IsString()
	@IsNotEmpty()
	@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
	password: string;

	@Prop()
	@ApiProperty({ description: 'Full Name', example: 'Nguyen Van A' })
	@IsString()
	@IsNotEmpty()
	fullName: string;

	@Prop()
	@ApiProperty({ description: 'Phone', example: '0909090909' })
	@IsString()
	@IsNotEmpty()
	phone: string;

	@Prop({ required: true, enum: UserStatus, default: UserStatus.ACTIVE })
	@ApiProperty({ description: 'Status', example: UserStatus.ACTIVE })
	status: UserStatus;

	@Prop({ required: true, enum: UserType, default: UserType.EMPLOYEE })
	@ApiProperty({ description: 'Type', example: UserType.EMPLOYEE })
	type: UserType;

	@Prop({
		required: true,
		default: () => crypto.randomBytes(16).toString('hex'),
	})
	@ApiProperty({ description: 'Hash Key', example: '1234567890' })
	hashKey: string;


	@Prop({
		type: Types.ObjectId,
		ref: Role.name,
		required: true,
		autopopulate: true,
	})
	@ApiProperty({ description: 'Role', type: String, example: '60a0a0a0a0a0a0a0a0a0a0a0' })
	@IsMongoIdObject()
	@Transform(({value}:{value:string})=> new Types.ObjectId(value))
	role: Role;

	@Prop({
		type: String,
		required: false,
		default: null,
	})
	@ApiProperty({ description: 'Avatar', example: '/default/default.svg', format: 'binary' })
	avatar: string;

	@Prop({
		type: Number,
		required: true,
		default: 1,
	})
	@ApiProperty({ description: 'Level Salary', example: 1 })
	level_salary: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
