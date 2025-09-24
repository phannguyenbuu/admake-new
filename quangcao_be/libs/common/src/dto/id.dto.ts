import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Types } from 'mongoose';
import { IsMongoIdObject } from '@libs/common/validators/isMongoIdObject.val';

export class IdDto {
	@ApiProperty({
		description: 'ID của đối tượng',
		example: '60d0fe4f5311236168a109ca',
		type: 'string',
	})
	@IsMongoIdObject()
	@Transform(({ value }) => new Types.ObjectId(value))
	id: Types.ObjectId;
}
