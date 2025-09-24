import { Module, OnModuleInit } from '@nestjs/common';
import { MaterialService } from './material.service';
import { MaterialController } from './material.controller';
import { Material, MaterialSchema } from './material.entity';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
	imports: [MongooseModule.forFeature([{ name: Material.name, schema: MaterialSchema }])],
	controllers: [MaterialController],
	providers: [MaterialService],
	exports: [MaterialService],
})
export class MaterialModule {
	private readonly DEFAULT_MATERIALS: Partial<Material>[] = [
		{
			name: 'Vật tư 1',
			description: 'Vật tư 1',
			supplier: 'Nhà cung cấp 1',
			price: 100000,
			unit: 'Cái',
			quantity: 100,
			image: '/default/default.svg',
		},
		{
			name: 'Vật tư 2',
			description: 'Vật tư 2',
			supplier: 'Nhà cung cấp 2',
			price: 200000,
			unit: 'Cái',
			quantity: 200,
			image: '/default/default.svg',
		},
		{
			name: 'Vật tư 3',
			description: 'Vật tư 3',
			supplier: 'Nhà cung cấp 3',
			price: 300000,
			unit: 'Cái',
			quantity: 300,
			image: '/default/default.svg',
		},
	];
	constructor(private readonly materialService: MaterialService) {}

	async onModuleInit() {
		if ((await this.materialService.model.countDocuments()) === 0) {
			await this.materialService.model.insertMany(this.DEFAULT_MATERIALS);
		}
	}
}
