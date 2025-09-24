import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Role } from './role.entity';
import { Model } from 'mongoose';
import { ServiceBase } from '@libs/common/base/service.base';

@Injectable()
export class RoleService extends ServiceBase<Role> {
	constructor(@InjectModel(Role.name) private roleModel: Model<Role>) {
		super(roleModel);
	}
}
