import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { Customer } from './customer.entity';
import { PaginationDto } from '@libs/common/dto/pagination.dto';
import { ApiNote } from '@libs/common/decorators/api.decorator';
import { ApiException } from '@libs/common/exception/api.exception';
import { ApiController } from '@libs/common/decorators/api.decorator';
import { IdDto } from '@libs/common/dto/id.dto';
import { RequirePermission } from '@libs/common/decorators/permission.decorator';
import { UserPermission } from 'src/user/user.enum';
import { CustomerCreateDto, CustomerUpdateDto } from './dto/customer.dto';

@ApiController(Customer.path)

export class CustomerController {
	constructor(private readonly customerService: CustomerService) {}

	@Get()
	@ApiNote('Lấy danh sách khách hàng')
	async findAll(@Query() dto: PaginationDto) {
		return this.customerService.findPage(dto, ['phone', 'fullName']);
	}

	@Get(':id')
	@ApiNote('Lấy khách hàng theo id')
	async findOne(@Param() dto: IdDto) {
		return this.customerService.findById(dto.id).orThrow(ApiException.CUSTOMER_NOT_FOUND);
	}

	@Post()
	@ApiNote('Tạo khách hàng')
	@RequirePermission(UserPermission.CUSTOMER_MANAGEMENT)
	async create(@Body() dto: CustomerCreateDto) {
		const customer = await this.customerService.findOne({ phone: dto.phone });
		if (customer) {
			throw ApiException.CUSTOMER_ALREADY_EXISTS;
		}
		return this.customerService.create(dto);
	}

	@Put(':id')
	@ApiNote('Cập nhật khách hàng')
	@RequirePermission(UserPermission.CUSTOMER_MANAGEMENT)
	async update(@Param() dto: IdDto, @Body() body: CustomerUpdateDto) {
		await this.customerService
			.findOne({
				_id: dto.id,
				deletedAt: null,
			})
			.orThrow(ApiException.CUSTOMER_NOT_FOUND);
		return this.customerService.model.findByIdAndUpdate(dto.id, { ...body }, { new: true });
	}

	@Delete(':id')
	@ApiNote('Xóa khách hàng')
	@RequirePermission(UserPermission.CUSTOMER_MANAGEMENT)
	async delete(@Param() dto: IdDto) {
		const customer = await this.customerService.findById(dto.id).orThrow(ApiException.CUSTOMER_NOT_FOUND);
		return this.customerService.softDelete(customer._id);
	}
}
