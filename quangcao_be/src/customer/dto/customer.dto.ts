import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Customer } from '../customer.entity';

export class CustomerCreateDto extends PickType(Customer, [
	'fullName',
	'phone',
	'workInfo',
	'workStart',
	'workEnd',
	'workAddress',
	'workPrice',
	'status',
]) {}

export class CustomerUpdateDto extends PartialType(CustomerCreateDto) {}
