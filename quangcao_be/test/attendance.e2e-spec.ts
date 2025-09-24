import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ACCESS_TOKEN } from './constant';
import { AttendanceType } from '../src/attendance/attendance.enum';

describe('AttendanceController (e2e)', () => {
	let app: INestApplication;
	let attendanceId: string;
	let userId: string;
	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();
		app = moduleFixture.createNestApplication();
		await app.init();
	});
	afterAll(async () => {
		await app.close();
	});
	it('/attendance (GET) - lấy chấm công hiện tại', async () => {
		const res = await request(app.getHttpServer())
			.get('/attendance')
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);
		expect(res.body).toHaveProperty('_id');
		expect(res.body).toHaveProperty('userId');
		attendanceId = res.body._id;
		userId = res.body.userId;
	});

	it('/attendance/check (POST) - checkin', async () => {
		const res = await request(app.getHttpServer())
			.post('/attendance/check')
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.send({
				type: AttendanceType.IN,
				longitude: 106.7,
				latitude: 10.7,
				ssid: 'test',
				bssid: 'test',
				note: 'Checkin test',
			})
			.expect(201);
		expect(res.body).toHaveProperty('records');
		expect(res.body.records.in).toBeDefined();
		expect(res.body.records.in.note).toBe('Checkin test');
	});

	it('/attendance/check (POST) - checkout', async () => {
		const res = await request(app.getHttpServer())
			.post('/attendance/check')
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.send({
				type: AttendanceType.OUT,
				longitude: 106.7,
				latitude: 10.7,
				ssid: 'test',
				bssid: 'test',
				note: 'Checkout test',
			})
			.expect(201);
		expect(res.body).toHaveProperty('records');
		expect(res.body.records.out).toBeDefined();
		expect(res.body.records.out.note).toBe('Checkout test');
	});

	it('/attendance/report (GET) - lấy report 30 ngày user hiện tại', async () => {
		const res = await request(app.getHttpServer())
			.get('/attendance/report')
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);
		expect(Array.isArray(res.body)).toBe(true);
	});

	it('/attendance/report/:id (GET) - lấy report theo userId', async () => {
		const res = await request(app.getHttpServer())
			.get(`/attendance/report/${userId}`)
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.query({
				fromDate: Date.now() - 1000 * 60 * 60 * 24 * 30,
				toDate: Date.now(),
			})
			.expect(200);
		expect(Array.isArray(res.body)).toBe(true);
	});
});
