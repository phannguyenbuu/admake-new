import { Module, OnModuleInit } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Customer, CustomerSchema } from './customer.entity';
import { CustomerStatus } from './customer.enum';

@Module({
	imports: [MongooseModule.forFeature([{ name: Customer.name, schema: CustomerSchema }])],
	controllers: [CustomerController],
	providers: [CustomerService],
})
export class CustomerModule implements OnModuleInit {
	private readonly customerDefault: Partial<Customer>[] = [
		{
			fullName: 'Nguyễn Văn A',
			phone: '0909090909',
			workInfo: 'Công việc 1',
			workStart: new Date(),
			workEnd: new Date(),
			workAddress: 'Địa chỉ 1',
			workPrice: 1000000,
			status: CustomerStatus.BOOKED,
		},
		{
			fullName: 'Nguyễn Văn B',
			phone: '0909090909',
			workInfo: 'Công việc 2',
			workStart: new Date(),
			workEnd: new Date(),
			workAddress: 'Địa chỉ 2',
			workPrice: 1000000,
			status: CustomerStatus.BOOKED,
		},
		{
			fullName: 'Nguyễn Văn C',
			phone: '0909090909',
			workInfo: 'Công việc 3',
			workStart: new Date(),
			workEnd: new Date(),
			workAddress: 'Địa chỉ 3',
			workPrice: 1000000,
			status: CustomerStatus.BOOKED,
		},
	];
	constructor(private readonly customerService: CustomerService) {}

	async onModuleInit() {
		if ((await this.customerService.model.countDocuments()) === 0) {
			await this.customerService.model.insertMany(this.customerDefault);
		}
	}
}
