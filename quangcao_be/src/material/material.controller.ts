import { Body, Controller, Delete, Get, Param, Post, Put, Query, UploadedFile } from '@nestjs/common';
import { MaterialService } from './material.service';
import { ApiController, ApiFile, ApiModel, ApiNote, ApiPage } from '@libs/common/decorators/api.decorator';
import { Material } from './material.entity';
import { UserPermission } from 'src/user/user.enum';
import { RequirePermission } from '@libs/common/decorators/permission.decorator';
import { BufferFile } from '@libs/common/@types/utils';
import { FileUtil } from '@libs/common/utils/file.util';
import { CreateMaterialDto, UpdateMaterialDto } from './dto/material.dto';
import { PaginationDto } from '@libs/common/dto/pagination.dto';
import { IdDto } from '@libs/common/dto/id.dto';
import { ApiException } from '@libs/common/exception/api.exception';
import { ApiResponse, getSchemaPath } from '@nestjs/swagger';

@ApiController(Material.path)

export class MaterialController {
	constructor(private readonly materialService: MaterialService) {}

	@Post()
	@ApiFile('image')
	@ApiNote('Tạo vật tư')
	@RequirePermission(UserPermission.WAREHOUSE_MANAGEMENT)
	async createMaterial(@Body() createMaterialDto: CreateMaterialDto, @UploadedFile() image: BufferFile) {
		const imagePath = await FileUtil.SaveFileBuffer(image, {
			randomName: true,
			destination: Material.path,
		});
		return this.materialService.create({ ...createMaterialDto, image: imagePath });
	}

	@Get()
	@ApiNote('Lấy danh sách vật tư')
	@ApiPage(Material)
	async getMaterials(@Query() query: PaginationDto) {
		return this.materialService.findPage(query, ['name', 'description']);
	}

	@Get(':id')
	@ApiNote('Lấy vật tư theo id')
	async getMaterialById(@Param() dto: IdDto) {
		return this.materialService.findById(dto.id).orThrow(ApiException.MATERIAL_NOT_FOUND);
	}

	@Put(':id')
	@ApiNote('Cập nhật vật tư')
	@ApiFile('image')
	@RequirePermission(UserPermission.WAREHOUSE_MANAGEMENT)
	async updateMaterial(
		@Param() dto: IdDto,
		@Body() updateMaterialDto: UpdateMaterialDto,
		@UploadedFile() image: BufferFile,
	) {
		const material = await this.materialService.findById(dto.id).orThrow(ApiException.MATERIAL_NOT_FOUND);
		if (image) {
			updateMaterialDto.image = await FileUtil.SaveFileBuffer(image, {
				randomName: true,
				destination: Material.path,
			});
		}
		return this.materialService.model.findByIdAndUpdate(material._id, { ...updateMaterialDto }, { new: true });
	}

	@Delete(':id')
	@ApiNote('Xóa vật tư')
	@RequirePermission(UserPermission.WAREHOUSE_MANAGEMENT)
	async deleteMaterial(@Param() dto: IdDto) {
		const material = await this.materialService.findById(dto.id).orThrow(ApiException.MATERIAL_NOT_FOUND);
		if (material.image) {
			try {
				await FileUtil.RemoveFile(material.image);
			} catch (error) {}
		}
		return this.materialService.softDelete(material._id);
	}
}
