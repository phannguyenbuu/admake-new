import { Injectable } from '@nestjs/common';
import { Customer } from './customer.entity';
import { InjectModel } from '@nestjs/mongoose';
import { ServiceBase } from '@libs/common/base/service.base';
import { Model } from 'mongoose';

@Injectable()
export class CustomerService extends ServiceBase<Customer> {
	constructor(@InjectModel(Customer.name) private customerModel: Model<Customer>) {
		super(customerModel);
	}
}
