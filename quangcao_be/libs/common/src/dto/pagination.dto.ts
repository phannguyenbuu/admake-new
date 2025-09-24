import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginationDto {
	@IsOptional()
	@IsNumber()
	@Min(1)
	@Type(() => Number)
	@ApiProperty({
		description: 'Page',
		example: 1,
		required: false,
	})
	page: number = 1;

	@IsOptional()
	@IsNumber()
	@Min(1)
	@Max(100)
	@Type(() => Number)
	@ApiProperty({
		description: 'Limit',
		example: 10,
		required: false,
	})
	limit: number = 10;

	@IsOptional()
	@IsString()
	@Type(() => String)
	@ApiProperty({
		description: 'Search',
		example: '',
		required: false,
	})
	search: string = '';
}
