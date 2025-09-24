import { DocumentBase } from '@libs/common/base/document.base';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { User } from 'src/user/user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

@Schema({
	timestamps: true,
})
export class Workspace extends DocumentBase {
	@Prop({ type: String })
	@ApiProperty({
		description: 'Tên của workspace',
		example: 'Workspace 1',
	})
	@IsString()
	name: string;

	@Prop({ type: Types.ObjectId, ref: User.name })
	ownerId: Types.ObjectId;
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);
