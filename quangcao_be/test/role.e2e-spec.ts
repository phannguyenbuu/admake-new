import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { disconnect } from 'mongoose';
import { ACCESS_TOKEN } from './constant';
import { Role } from 'src/role/role.entity';
import { RoleService } from 'src/role/role.service';
import { UserPermission } from 'src/user/user.enum';
describe('RoleController (e2e)', () => {
	let app: INestApplication;
	let createdId: string;
	const roleData: Partial<Role> = {
		name: 'Quản trị viên',
		permissions: [UserPermission.USER_MANAGEMENT, UserPermission.ROLE_MANAGEMENT],
	};
	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();
		app = moduleFixture.createNestApplication();
		await app.init();
	});
	afterAll(async () => {
		// xóa role vừa tạo
		const roleService = app.get(RoleService);
		if (createdId) {
			await roleService.deleteOne({ _id: createdId });
		}
		await app.close();
		await disconnect();
	});
	it('/role (POST) - tạo vai trò', async () => {
		const res = await request(app.getHttpServer())
			.post('/role')
			.send(roleData)
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(201);
		expect(res.body).toHaveProperty('_id');
		createdId = res.body._id;
		expect(res.body.name).toBe(roleData.name);
	});
	it('/role (GET) - lấy danh sách vai trò', async () => {
		const res = await request(app.getHttpServer())
			.get('/role')
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);
		expect(Array.isArray(res.body)).toBe(true);
		expect(res.body.find((r: any) => r._id === createdId)).toBeTruthy();
	});
	it('/role/:id (GET) - lấy vai trò theo id', async () => {
		const res = await request(app.getHttpServer())
			.get(`/role/${createdId}`)
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);
		expect(res.body).toHaveProperty('_id', createdId);
		expect(res.body.name).toBe(roleData.name);
	});
	it('/role/:id (PUT) - cập nhật vai trò', async () => {
		const updateData = { name: 'Quản trị viên cập nhật' };
		const res = await request(app.getHttpServer())
			.put(`/role/${createdId}`)
			.send(updateData)
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);
		expect(res.body).toHaveProperty('name', updateData.name);
	});
	it('/role/:id (DELETE) - xóa vai trò', async () => {
		const res = await request(app.getHttpServer())
			.delete(`/role/${createdId}`)
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);
		expect(res.body).toHaveProperty('matchedCount');
		expect(res.body.matchedCount).toBe(1);
		expect(res.body.modifiedCount).toBe(1);
	});
	it('/role/list/permission (GET) - lấy danh sách quyền', async () => {
		const res = await request(app.getHttpServer())
			.get('/role/list/permission')
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);
		expect(Array.isArray(res.body)).toBe(true);
		expect(res.body[0]).toHaveProperty('value');
		expect(res.body[0]).toHaveProperty('label');
	});
});
