import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { IsNumber } from 'class-validator';
import { IsMongoIdObject } from '@libs/common/validators/isMongoIdObject.val';
import { Transform } from 'class-transformer';
import { type Material } from 'src/material/material.entity';

export class TaskMaterial {
	@IsMongoIdObject()
	@ApiProperty({
		description: 'Id của vật tư',
		example: '60a0a0a0a0a0a0a0a0a0a0a0',
	})
	@Transform(({ value }) => new Types.ObjectId(value))
	materialId: Types.ObjectId;

	@ApiProperty({
		description: 'Vật tư',
		example: {
			name: 'Vật tư 1',
			price: 100000,
		},
	})
	material: Material;

	@IsNumber()
	@ApiProperty({
		description: 'Số lượng vật tư',
		example: 10,
	})
	@Transform(({ value }) => Number(value))
	quantity: number;
}
