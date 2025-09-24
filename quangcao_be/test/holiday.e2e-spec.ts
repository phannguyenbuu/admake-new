import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ACCESS_TOKEN } from './constant';
import { HolidayType } from '../src/holiday/holiday.enum';

describe('HolidayController (e2e)', () => {
	let app: INestApplication;

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

	it('/holiday (POST) - tạo ngày nghỉ mới', async () => {
		const holidayData = {
			name: 'Tết Nguyên Đán 2024',
			startDate: new Date('2024-02-10'),
			endDate: new Date('2024-02-14'),
			type: HolidayType.PUBLIC_HOLIDAY,
			description: 'Nghỉ Tết Nguyên Đán 2024',
		};

		const res = await request(app.getHttpServer())
			.post('/holiday')
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.send(holidayData)
			.expect(201);
		expect(res.body).toHaveProperty('_id');
		expect(res.body.name).toBe(holidayData.name);
		expect(res.body.type).toBe(holidayData.type);
	});

	it('/holiday (GET) - lấy danh sách ngày nghỉ', async () => {
		const res = await request(app.getHttpServer())
			.get('/holiday')
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);
		expect(Array.isArray(res.body)).toBe(true);
	});

	it('/holiday/month (GET) - lấy ngày nghỉ theo tháng', async () => {
		const year = new Date().getFullYear();
		const month = new Date().getMonth() + 1;

		const res = await request(app.getHttpServer())
			.get(`/holiday/month?year=${year}&month=${month}`)
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);
		expect(Array.isArray(res.body)).toBe(true);
	});

	it('/holiday/year (GET) - lấy ngày nghỉ theo năm', async () => {
		const year = new Date().getFullYear();

		const res = await request(app.getHttpServer())
			.get(`/holiday/year?year=${year}`)
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);
		expect(Array.isArray(res.body)).toBe(true);
	});

	it('/holiday/type/:type (GET) - lấy ngày nghỉ theo loại', async () => {
		const res = await request(app.getHttpServer())
			.get(`/holiday/type/${HolidayType.PUBLIC_HOLIDAY}`)
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);
		expect(Array.isArray(res.body)).toBe(true);
	});

	it('/holiday/check/:date (GET) - kiểm tra ngày có phải là ngày nghỉ không', async () => {
		const testDate = '2024-02-10';

		const res = await request(app.getHttpServer())
			.get(`/holiday/check/${testDate}`)
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);
		expect(res.body).toHaveProperty('isHoliday');
		expect(typeof res.body.isHoliday).toBe('boolean');
	});

	it('/holiday/statistics (GET) - lấy thống kê ngày nghỉ', async () => {
		const year = new Date().getFullYear();

		const res = await request(app.getHttpServer())
			.get(`/holiday/statistics?year=${year}`)
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);
		expect(res.body).toHaveProperty(HolidayType.PUBLIC_HOLIDAY);
		expect(res.body).toHaveProperty(HolidayType.COMPANY_HOLIDAY);
	});

	it('/holiday/total-days (GET) - tính tổng số ngày nghỉ', async () => {
		const startDate = '2024-01-01';
		const endDate = '2024-12-31';

		const res = await request(app.getHttpServer())
			.get(`/holiday/total-days?startDate=${startDate}&endDate=${endDate}`)
			.set('Authorization', `Bearer ${ACCESS_TOKEN}`)
			.expect(200);
		expect(typeof res.body).toBe('number');
	});
}); 