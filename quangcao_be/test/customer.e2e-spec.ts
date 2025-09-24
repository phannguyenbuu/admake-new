import { INestApplication, ValidationPipe } from '@nestjs/common';

import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { disconnect } from 'mongoose';
import { ACCESS_TOKEN } from './constant';
import { Customer } from 'src/customer/customer.entity';
import { Page } from '@libs/common/struct/page';
import { CustomerService } from 'src/customer/customer.service';
import { CustomerStatus } from 'src/customer/customer.enum';
import { fakerJs } from './constant';
describe('CustomerController (e2e)', () => {
	let app: INestApplication;
	let createdId: string;
	const customerData = {
		fullName: fakerJs.person.fullName(),
		phone: fakerJs.phone.number().replace(/ /g, ''),
		workInfo: fakerJs.lorem.sentence(),
		workStart: fakerJs.date.past().getTime(),
		workEnd: fakerJs.date.future().getTime(),
		workAddress: fakerJs.location.streetAddress(),
		workPrice: fakerJs.number.int({ min: 1000000, max: 10000000 }),
		status: fakerJs.helpers.arrayElement(Object.values(CustomerStatus)),
	};
	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();
		app = moduleFixture.createNestApplication();

		await app.init();
	});
	afterAll(async () => {
		// xóa tất cả khách hàng
		const customerService = app.get(CustomerService);
		if (createdId) {
			await customerService.deleteOne({
				_id: createdId,
			});
		}
		await app.close();
		await disconnect();
	});
	it('/customer (POST) - tạo khách hàng', async () => {
		const res = await request(app.getHttpServer())
			.post('/customer')
			.send(customerData)
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(201);
		expect(res.body).toHaveProperty('_id');
		createdId = res.body._id;
		expect(res.body.fullName).toBe(customerData.fullName);
		expect(res.body.phone).toBe(customerData.phone);
	});

	it('/customer (GET) - lấy danh sách khách hàng', async () => {
		const res = await request(app.getHttpServer())
			.get('/customer?page=1&limit=10')
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);
		const page = res.body as Page<Customer>;
		expect(page.data).toBeInstanceOf(Array);
		expect(page.total).toBeGreaterThanOrEqual(1);
	});

	it('/customer/:id (GET) - lấy khách hàng theo id', async () => {
		const res = await request(app.getHttpServer())
			.get(`/customer/${createdId}`)
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);
		expect(res.body).toHaveProperty('_id', createdId);
		expect(res.body.fullName).toBe(customerData.fullName);
	});

	it('/customer/:id (PUT) - cập nhật khách hàng', async () => {
		const updateData = { fullName: 'Nguyễn Văn Đã Cập Nhật' };
		const res = await request(app.getHttpServer())
			.put(`/customer/${createdId}`)
			.send(updateData)
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);
		expect(res.body).toHaveProperty('fullName', updateData.fullName);
	});

	it('/customer/:id (DELETE) - xóa khách hàng', async () => {
		const res = await request(app.getHttpServer())
			.delete(`/customer/${createdId}`)
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);
		expect(res.body).toHaveProperty('matchedCount');
		expect(res.body.matchedCount).toBe(1);
		expect(res.body.modifiedCount).toBe(1);
	});
});
