import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class DateQueryDto {
	@IsOptional()
	@IsNumber()
	@Min(0)
	@ApiProperty({
		description: 'Thời gian bắt đầu',
		example: 1716537600,
	})
	@Transform(({ value }: { value: string }) => parseInt(value))
	from: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@ApiProperty({
		description: 'Thời gian kết thúc',
		example: 1716537600,
	})
	@Transform(({ value }: { value: string }) => parseInt(value))
	to: number;
}
