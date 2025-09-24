import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Material } from '../material.entity';
import { BufferFile } from '@libs/common/@types/utils';

export class CreateMaterialDto extends PickType(Material, [
	'name',
	'description',
	'supplier',
	'price',
	'unit',
	'quantity',
	'image',
]) {}

export class UpdateMaterialDto extends PartialType(CreateMaterialDto) {}
