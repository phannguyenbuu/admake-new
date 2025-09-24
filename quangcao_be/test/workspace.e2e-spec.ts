import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { disconnect } from 'mongoose';
import { ACCESS_TOKEN, fakerJs } from './constant';
import { WorkspaceService } from 'src/workspace/workspace.service';
import { RoleService } from 'src/role/role.service';
import { UserStatus, UserType } from 'src/user/user.enum';

describe('WorkspaceController (e2e)', () => {
	let app: INestApplication;
	let createdWorkspaceId: string;
	let createdUserId: string;
	let createdRoleId: string;
	let workspaceData: any;

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();
		app = moduleFixture.createNestApplication();
		await app.init();

		// Xóa tất cả workspace test cũ
		const workspaceService = app.get(WorkspaceService);
		await workspaceService.model.deleteMany({ name: { $regex: /^Workspace Test / } });

		workspaceData = {
			name: 'Workspace Test ' + fakerJs.string.alphanumeric(10) + ' ' + Date.now(),
		};
	});

	afterAll(async () => {
		// Xóa workspace, user và role vừa tạo
		const workspaceService = app.get(WorkspaceService);
		const roleService = app.get(RoleService);

		if (createdWorkspaceId) {
			await workspaceService.deleteOne({ _id: createdWorkspaceId });
		}
		await app.close();
		await disconnect();
	});

	it('/workspace (POST) - tạo workspace', async () => {
		const res = await request(app.getHttpServer())
			.post('/workspace')
			.send(workspaceData)
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`);

		console.log('Response status:', res.status);
		console.log('Response body:', res.body);
		console.log('Workspace data sent:', workspaceData);

		expect(res.status).toBe(201);
		expect(res.body).toHaveProperty('_id');
		createdWorkspaceId = res.body._id;
		expect(res.body.name).toBe(workspaceData.name);
		expect(res.body.ownerId).toBeDefined();
		expect(res.body.createdAt).toBeDefined();
		expect(res.body.updatedAt).toBeDefined();
	});

	it('/workspace (POST) - tạo workspace với tên đã tồn tại (nên fail)', async () => {
		await request(app.getHttpServer())
			.post('/workspace')
			.send(workspaceData)
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(400);
	});

	it('/workspace (GET) - lấy danh sách workspace', async () => {
		const res = await request(app.getHttpServer())
			.get('/workspace')
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);

		expect(Array.isArray(res.body)).toBe(true);
		expect(res.body.length).toBeGreaterThanOrEqual(1);

		// Kiểm tra workspace vừa tạo có trong danh sách
		const createdWorkspace = res.body.find((ws: any) => ws._id === createdWorkspaceId);
		expect(createdWorkspace).toBeDefined();
		expect(createdWorkspace.name).toBe(workspaceData.name);
	});

	it('/workspace/:id (GET) - lấy workspace theo id', async () => {
		const res = await request(app.getHttpServer())
			.get(`/workspace/${createdWorkspaceId}`)
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);

		expect(res.body).toHaveProperty('_id', createdWorkspaceId);
		expect(res.body.name).toBe(workspaceData.name);
		expect(res.body.ownerId).toBeDefined();
	});

	it('/workspace/:id (GET) - lấy workspace với id không tồn tại (nên fail)', async () => {
		const fakeId = '60a0a0a0a0a0a0a0a0a0a0a0';
		await request(app.getHttpServer())
			.get(`/workspace/${fakeId}`)
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(404);
	});

	it('/workspace/:id (PUT) - cập nhật workspace', async () => {
		const updateData = {
			name: 'Workspace đã cập nhật ' + fakerJs.string.alphanumeric(5),
		};

		const res = await request(app.getHttpServer())
			.put(`/workspace/${createdWorkspaceId}`)
			.send(updateData)
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);

		expect(res.body).toHaveProperty('_id', createdWorkspaceId);
		expect(res.body.name).toBe(updateData.name);
		expect(res.body.ownerId).toBeDefined();
	});

	it('/workspace/:id (PUT) - cập nhật workspace với id không tồn tại (nên fail)', async () => {
		const fakeId = '60a0a0a0a0a0a0a0a0a0a0a0';
		const updateData = { name: 'Workspace không tồn tại' };

		await request(app.getHttpServer())
			.put(`/workspace/${fakeId}`)
			.send(updateData)
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(404);
	});

	it('/workspace/:id (DELETE) - xóa workspace', async () => {
		const res = await request(app.getHttpServer())
			.delete(`/workspace/${createdWorkspaceId}`)
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);

		expect(res.body).toHaveProperty('matchedCount');
		expect(res.body).toHaveProperty('modifiedCount');
		expect(res.body.matchedCount).toBe(1);
		expect(res.body.modifiedCount).toBe(1);
	});
});
