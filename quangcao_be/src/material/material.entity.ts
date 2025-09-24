import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { DocumentBase } from '@libs/common/base/document.base';
import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

@Schema({ collection: 'materials', timestamps: true })
@ApiExtraModels(Material)
export class Material extends DocumentBase {
	@Prop({ required: true, type: String })
	@ApiProperty({
		description: 'The name of the material',
		example: 'Material 1',
	})
	@IsString()
	name: string;

	@Prop({ required: true, type: Number })
	@ApiProperty({
		description: 'The quantity of the material',
		example: 100,
	})
	@IsNumber()
	@Min(0)
	@Transform(({ value }) => Number(value))
	quantity: number;

	@Prop({ required: true, type: String })
	@ApiProperty({
		description: 'The unit of the material',
		example: 'kg',
	})
	@IsString()
	unit: string;

	@Prop({ required: true, type: Number })
	@ApiProperty({
		description: 'The price of the material',
		example: 100,
	})
	@IsNumber()
	@Min(0)
	@Transform(({ value }) => Number(value))
	price: number;

	@Prop({ required: true, type: String })
	@ApiProperty({
		description: 'The image of the material',
		type: String,
		format: 'binary',
	})
	@IsOptional()
	image?: string;

	@Prop({ required: true, type: String })
	@ApiProperty({
		description: 'The description of the material',
		example: 'This is a description of the material',
	})
	@IsString()
	@IsOptional()
	description: string;

	@Prop({ required: true, type: String })
	@ApiProperty({
		description: 'The supplier of the material',
		example: 'Supplier 1',
	})
	@IsString()
	@IsOptional()
	supplier: string;
}

export const MaterialSchema = SchemaFactory.createForClass(Material);
