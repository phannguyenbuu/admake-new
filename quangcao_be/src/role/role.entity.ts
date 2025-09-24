import { DocumentBase } from '@libs/common/base/document.base';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserPermission } from 'src/user/user.enum';

@Schema({ collection: 'roles', timestamps: true })
export class Role extends DocumentBase {
	@Prop({ required: true, default: [] })
	@ApiProperty({
		description: 'Permissions',
		example: Array.from(Object.values(UserPermission)),
	})
	@IsArray()
	@IsNotEmpty()
	permissions: UserPermission[];

	@ApiProperty({ description: 'Name', example: 'admin' })
	@IsString()
	@IsNotEmpty()
	@Transform(({ value }: { value: string }) => value.trim())
	@Prop({ required: true, trim: true })
	name: string;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
