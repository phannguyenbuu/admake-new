import { PartialType, PickType } from '@nestjs/swagger';
import { User } from '../user.entity';

export class UserCreateDto extends PickType(User, [
	'username',
	'password',
	'phone',
	'fullName',
	'type',
	'level_salary',
	'avatar',
	'role',
]) {}
export class UserUpdateDto extends PartialType(UserCreateDto) {}

export class UserUpdateMeDto extends PartialType(PickType(User, ['fullName', 'phone', 'password'])) {}
export class UserUpdateMeAvatarDto extends PartialType(PickType(User, ['avatar'])) {}
