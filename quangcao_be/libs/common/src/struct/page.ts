import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto } from '../dto/pagination.dto';

export class Page<T> {
	@ApiProperty({
		description: 'Data',
		type: [Object],
		example: [],
	})
	data: T[];

	@ApiProperty({
		description: 'Total',
		example: 100,
	})
	total: number;

	@ApiProperty({
		description: 'Page',
		example: 1,
	})
	page: number;

	@ApiProperty({
		description: 'Limit',
		example: 10,
	})
	limit: number;

	@ApiProperty({
		description: 'Total pages',
		example: 10,
	})
	totalPages: number;

	meta: Record<string, any>;

	constructor(data: T[], dto: PaginationDto, total: number) {
		this.data = data;
		this.total = total;
		this.page = dto.page;
		this.limit = dto.limit;
		this.totalPages = Math.ceil(total / dto.limit);
		this.meta = {};
	}

	addMeta(key: string, value: any) {
		this.meta[key] = value;
	}
}
