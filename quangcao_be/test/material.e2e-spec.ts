import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { disconnect } from 'mongoose';
import * as path from 'path';
import { ACCESS_TOKEN } from './constant';
import { Material } from 'src/material/material.entity';
import { Page } from '@libs/common/struct/page';
import { MaterialService } from 'src/material/material.service';
describe('MaterialController (e2e)', () => {
	let app: INestApplication;
	let createdId: string;

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();
		app = moduleFixture.createNestApplication();
		await app.init();
	});

	afterAll(async () => {
		// xóa tất cả vật tư
		const materialService = app.get(MaterialService);
		if (createdId) {
			await materialService.deleteOne({
				_id: createdId,
			});
		}
		await app.close();
		await disconnect();
	});

	it('/material (POST) - tạo vật tư', async () => {
		const res = await request(app.getHttpServer())
			.post('/material')
			.field('name', 'Vật tư test')
			.field('description', 'desc')
			.field('supplier', 'supplier')
			.field('price', 1000)
			.field('unit', 'cái')
			.field('quantity', 10)
			.attach('image', path.join(__dirname, '../uploads/default/default.svg'))
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(201);
		expect(res.body).toHaveProperty('_id');
		createdId = res.body._id;
		expect(res.body.name).toBe('Vật tư test');
	});

	it('/material (GET) - lấy danh sách vật tư', async () => {
		const res = await request(app.getHttpServer())
			.get('/material?page=1&limit=10')
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);
		const page = res.body as Page<Material>;
		expect(page.data).toBeInstanceOf(Array);
		expect(page.total).toBeGreaterThanOrEqual(1);
	});

	it('/material/:id (GET) - lấy vật tư theo id', async () => {
		const res = await request(app.getHttpServer())
			.get(`/material/${createdId}`)
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);
		expect(res.body).toHaveProperty('_id', createdId);
	});

	it('/material/:id (PUT) - cập nhật vật tư', async () => {
		const res = await request(app.getHttpServer())
			.put(`/material/${createdId}`)
			.field('name', 'Vật tư đã cập nhật')
			.attach('image', path.join(__dirname, '../uploads/default/default.svg'))
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);
		expect(res.body).toHaveProperty('name', 'Vật tư đã cập nhật');
	});

	it('/material/:id (DELETE) - xóa vật tư', async () => {
		const res = await request(app.getHttpServer())
			.delete(`/material/${createdId}`)
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);
		expect(res.body).toHaveProperty('matchedCount');
		expect(res.body.matchedCount).toBe(1);
		expect(res.body.modifiedCount).toBe(1);
	});
});
