import { OmitType, PickType } from '@nestjs/swagger';
import { Task } from '../task.entity';

export class TaskCreateDto extends PickType(Task, [
	'title',
	'description',
	'type',
	'reward',
	'assignIds',
	'workspaceId',
	'materials',
	'customerId',
	'startTime',
	'endTime',
]) {}
export class TaskUpdateDto extends OmitType(TaskCreateDto, ['materials']) {}
export class TaskStatusDto extends PickType(Task, ['status']) {}