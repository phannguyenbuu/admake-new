import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { disconnect } from 'mongoose';
import { ACCESS_TOKEN, fakerJs } from './constant';
import { UserService } from 'src/user/user.service';
import { UserStatus, UserType } from 'src/user/user.enum';
import { RoleService } from 'src/role/role.service';
describe('UserController (e2e)', () => {
	let app: INestApplication;
	let createdId: string;
	let roleId: string;
	let userData: any;
	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();
		app = moduleFixture.createNestApplication();
		await app.init();
		// Tạo role test
		const roleService = app.get(RoleService);
		const role = await roleService.create({
			name: 'Role Test User E2E',
			permissions: [],
		});
		roleId = role._id.toString();
		userData = {
			username: fakerJs.string.alphanumeric(10),
			password: 'Test@1234',
			fullName: fakerJs.person.fullName(),
			phone: fakerJs.phone.number().replace(/ /g, ''),
			type: UserType.EMPLOYEE,
			level_salary: 1,
			status: UserStatus.ACTIVE,
			role: roleId,
		};
	});
	afterAll(async () => {
		// xóa user và role vừa tạo
		const userService = app.get(UserService);
		const roleService = app.get(RoleService);
		if (createdId) {
			await userService.deleteOne({ _id: createdId });
		}
		if (roleId) {
			await roleService.deleteOne({ _id: roleId });
		}
		await app.close();
		await disconnect();
	});
	it('/user (POST) - tạo user', async () => {
		const res = await request(app.getHttpServer())
			.post('/user')
			.send(userData)
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(201);
		expect(res.body).toHaveProperty('_id');
		createdId = res.body._id;
		expect(res.body.fullName).toBe(userData.fullName);
		expect(res.body.username).toBe(userData.username);
		expect(res.body.role).toBeDefined();
	});
	it('/user (GET) - lấy danh sách user', async () => {
		const res = await request(app.getHttpServer())
			.get('/user?page=1&limit=10')
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);
		expect(res.body.data).toBeInstanceOf(Array);
		expect(res.body.total).toBeGreaterThanOrEqual(1);
	});
	it('/user/:id (GET) - lấy user theo id', async () => {
		const res = await request(app.getHttpServer())
			.get(`/user/${createdId}`)
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);
		expect(res.body).toHaveProperty('_id', createdId);
		expect(res.body.fullName).toBe(userData.fullName);
	});
	it('/user/:id (PUT) - cập nhật user', async () => {
		const updateData = { fullName: 'Người dùng đã cập nhật' };
		const res = await request(app.getHttpServer())
			.put(`/user/${createdId}`)
			.send(updateData)
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);
		expect(res.body).toHaveProperty('fullName', updateData.fullName);
	});
	it('/user/:id (DELETE) - xóa user', async () => {
		const res = await request(app.getHttpServer())
			.delete(`/user/${createdId}`)
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);
		expect(res.body).toHaveProperty('matchedCount');
		expect(res.body.matchedCount).toBe(1);
		expect(res.body.modifiedCount).toBe(1);
	});
});
