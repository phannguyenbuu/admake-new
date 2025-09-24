import { ApiProperty, OmitType, PartialType, PickType } from '@nestjs/swagger';
import { IsDate, IsString, IsEnum, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { HolidayType } from '../holiday.enum';
import { Holiday } from '../holiday.entity';

export class CreateHolidayDto extends PickType(Holiday, ['name', 'startDate', 'endDate', 'type', 'description', 'forUserId']) {}

export class UpdateHolidayDto extends PartialType(CreateHolidayDto) {}


export class HolidayResponseDto extends OmitType(Holiday, ['createdBy', 'createdAt', 'updatedAt', 'daysCount']) {
	
} 