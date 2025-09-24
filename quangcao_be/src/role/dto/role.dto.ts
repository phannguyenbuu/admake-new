import { PickType } from '@nestjs/swagger';
import { Role } from '../role.entity';

export class RoleCreateDto extends PickType(Role, ['name', 'permissions']) {}
export class RoleUpdateDto extends PickType(Role, ['name', 'permissions']) {}
