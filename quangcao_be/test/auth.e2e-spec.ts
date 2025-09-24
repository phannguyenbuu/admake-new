import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ACCESS_TOKEN, fakerJs } from './constant';
import * as path from 'path';
describe('AuthController (e2e)', () => {
	let app: INestApplication;
	let loginUser: { username: string; password: string };

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();
		app = moduleFixture.createNestApplication();
		await app.init();
		// Chuẩn bị user test (giả định đã có user tương ứng với ACCESS_TOKEN)
		loginUser = { username: 'tuannc', password: '123@Tuan' };
	});

	afterAll(async () => {
		await app.close();
	});

	it('/auth/login (POST) - đăng nhập', async () => {
		const res = await request(app.getHttpServer()).post('/auth/login').send(loginUser).expect(201);
		expect(res.body).toHaveProperty('access_token');
	});

	it('/auth/me (GET) - lấy thông tin user hiện tại', async () => {
		const res = await request(app.getHttpServer())
			.get('/auth/me')
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);
		expect(res.body).toHaveProperty('_id');
		expect(res.body).toHaveProperty('username');
	});

	it('/auth/me (PUT) - cập nhật thông tin user', async () => {
		const updateData = { fullName: fakerJs.person.fullName(), phone: fakerJs.phone.number() };
		const res = await request(app.getHttpServer())
			.put('/auth/me')
			.send(updateData)
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);
		expect(res.body).toHaveProperty('fullName', updateData.fullName);
		expect(res.body).toHaveProperty('phone', updateData.phone);
	});

	it('/auth/me/avatar (PUT) - cập nhật avatar', async () => {
		const res = await request(app.getHttpServer())
			.put('/auth/me/avatar')
			.attach('avatar', path.join(__dirname, '../uploads/default/default.svg'))
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);
		expect(res.body).toHaveProperty('avatar');
	});
});
