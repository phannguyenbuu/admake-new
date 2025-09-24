import { Injectable } from '@nestjs/common';
import { ServiceBase } from '@libs/common/base/service.base';
import { Material } from './material.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class MaterialService extends ServiceBase<Material> {
	constructor(@InjectModel(Material.name) private materialModel: Model<Material>) {
		super(materialModel);
	}
}
