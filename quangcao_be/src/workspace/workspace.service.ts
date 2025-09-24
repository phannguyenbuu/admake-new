import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Workspace } from './workspace.entity';
import { ServiceBase } from '@libs/common/base/service.base';

@Injectable()
export class WorkspaceService extends ServiceBase<Workspace> {
	constructor(@InjectModel(Workspace.name) private workspaceModel: Model<Workspace>) {
		super(workspaceModel);
	}
}
