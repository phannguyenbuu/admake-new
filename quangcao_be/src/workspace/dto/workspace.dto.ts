import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';
import { Types } from 'mongoose';
import { IsMongoIdObject } from '@libs/common/validators/isMongoIdObject.val';

export class WorkspaceDto {
	@IsMongoIdObject()
	@ApiProperty({
		description: 'ID của workspace',
		example: '60a0a0a0a0a0a0a0a0a0a0a0',
	})
	@Transform(({ value }: { value: string }) => new Types.ObjectId(value))
	workspaceId: Types.ObjectId;
}

export class WorkspaceCreateDto {
	@IsString()
	@ApiProperty({
		description: 'Tên của workspace',
		example: 'Workspace 1',
	})
	name: string;
}
