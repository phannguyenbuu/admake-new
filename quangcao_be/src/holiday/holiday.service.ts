import { ServiceBase } from '@libs/common/base/service.base';
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Holiday } from './holiday.entity';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { User } from 'src/user/user.entity';
import { HolidayType } from './holiday.enum';
import { CreateHolidayDto, UpdateHolidayDto } from './dto/holiday.dto';
import { ApiException } from '@libs/common/exception/api.exception';

@Injectable()
export class HolidayService extends ServiceBase<Holiday> {
	constructor(@InjectModel(Holiday.name) private holidayModel: Model<Holiday>) {
		super(holidayModel);
	}

	/**
	 * Tạo ngày nghỉ mới
	 */
	public async createHoliday(data: CreateHolidayDto, user: User): Promise<Holiday> {
		// Kiểm tra ngày bắt đầu và kết thúc
		if (data.startDate >= data.endDate) {
			throw ApiException.HOLIDAY_FROM_DATE_INVALID;
		}

		// Tính số ngày nghỉ
		const daysCount = this.calculateDaysCount(data.startDate, data.endDate);

		// Kiểm tra xung đột với ngày nghỉ hiện có
		await this.checkHolidayConflict(data.startDate, data.endDate, undefined, user._id);

		const holiday = await this.holidayModel.create({
			...data,
			daysCount,
			createdBy: user._id,
		});

		return holiday;
	}

	/**
	 * Cập nhật ngày nghỉ
	 */
	public async updateHoliday(id: string, data: UpdateHolidayDto & { daysCount?: number }, user: User): Promise<Holiday> {
		const holiday = await this.holidayModel.findById(id);
		if (!holiday) {
			throw new BadRequestException('Không tìm thấy ngày nghỉ');
		}

		// Kiểm tra ngày bắt đầu và kết thúc nếu có cập nhật
		if (data.startDate && data.endDate && data.startDate >= data.endDate) {
			throw new BadRequestException('Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
		}

		// Tính số ngày nghỉ nếu có cập nhật ngày
		if (data.startDate && data.endDate) {
			data.daysCount = this.calculateDaysCount(data.startDate, data.endDate);
			// Kiểm tra xung đột với ngày nghỉ khác (trừ ngày nghỉ hiện tại)
			await this.checkHolidayConflict(data.startDate, data.endDate, id, user._id);
		}

		const updatedHoliday = await this.holidayModel.findByIdAndUpdate(
			id,
			{ ...data },
			{ new: true },
		);

		if (!updatedHoliday) {
			throw new BadRequestException('Không thể cập nhật ngày nghỉ');
		}

		return updatedHoliday;
	}

	/**
	 * Lấy danh sách ngày nghỉ theo tháng/năm
	 */
	public async getHolidaysByMonth(year: number, month: number): Promise<Holiday[]> {
		const startDate = new Date(year, month - 1, 1);
		const endDate = new Date(year, month, 0, 23, 59, 59, 999);

		return await this.holidayModel
			.find({
				startDate: { $lte: endDate },
				endDate: { $gte: startDate },
				isActive: true,
			})
			.sort({ startDate: 1 });
	}

	/**
	 * Lấy danh sách ngày nghỉ theo năm
	 */
	public async getHolidaysByYear(year: number): Promise<Holiday[]> {
		const startDate = new Date(year, 0, 1);
		const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

		return await this.holidayModel
			.find({
				startDate: { $lte: endDate },
				endDate: { $gte: startDate },
				isActive: true,
			})
			.sort({ startDate: 1 });
	}

	/**
	 * Kiểm tra xem một ngày có phải là ngày nghỉ không
	 */
	public async isHoliday(date: Date): Promise<boolean> {
		const startOfDay = new Date(date);
		startOfDay.setHours(0, 0, 0, 0);
		const endOfDay = new Date(date);
		endOfDay.setHours(23, 59, 59, 999);

		const holiday = await this.holidayModel.findOne({
			startDate: { $lte: endOfDay },
			endDate: { $gte: startOfDay },
			isActive: true,
		});

		return !!holiday;
	}

	/**
	 * Lấy thông tin ngày nghỉ cho một ngày cụ thể
	 */
	public async getHolidayByDate(date: Date): Promise<Holiday | null> {
		const startOfDay = new Date(date);
		startOfDay.setHours(0, 0, 0, 0);
		const endOfDay = new Date(date);
		endOfDay.setHours(23, 59, 59, 999);

		return await this.holidayModel.findOne({
			startDate: { $lte: endOfDay },
			endDate: { $gte: startOfDay },
			isActive: true,
		});
	}

	/**
	 * Lấy danh sách ngày nghỉ theo loại
	 */
	public async getHolidaysByType(type: HolidayType): Promise<Holiday[]> {
		return await this.holidayModel
			.find({ type, isActive: true })
			.sort({ startDate: 1 });
	}

	/**
	 * Tính tổng số ngày nghỉ trong khoảng thời gian
	 */
	public async getTotalHolidayDays(startDate: Date, endDate: Date): Promise<number> {
		const holidays = await this.holidayModel.find({
			startDate: { $lte: endDate },
			endDate: { $gte: startDate },
			isActive: true,
		});

		let totalDays = 0;
		for (const holiday of holidays) {
			const overlapStart = new Date(Math.max(holiday.startDate.getTime(), startDate.getTime()));
			const overlapEnd = new Date(Math.min(holiday.endDate.getTime(), endDate.getTime()));
			const overlapDays = this.calculateDaysCount(overlapStart, overlapEnd);
			totalDays += overlapDays;
		}

		return totalDays;
	}

	/**
	 * Tính số ngày nghỉ giữa hai ngày
	 */
	public calculateDaysCount(startDate: Date, endDate: Date): number {
		const timeDiff = endDate.getTime() - startDate.getTime();
		const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
		return daysDiff + 1; // +1 vì tính cả ngày bắt đầu và kết thúc
	}

	/**
	 * Kiểm tra xung đột với ngày nghỉ hiện có
	 */
	private async checkHolidayConflict(startDate: Date, endDate: Date, excludeId?: string, userId?: Types.ObjectId): Promise<void> {
		const query: FilterQuery<Holiday> = {
			startDate: { $lte: endDate },
			endDate: { $gte: startDate },
			isActive: true,
			forUserId: userId,
		};
		if (excludeId) {
			query._id = { $ne: new Types.ObjectId(excludeId) };
		}
		const conflictingHoliday = await this.holidayModel.findOne(query);
		if (conflictingHoliday) {
			throw ApiException.HOLIDAY_CONFLICT;
		}
	}

	/**
	 * Lấy thống kê ngày nghỉ theo loại
	 */
	public async getHolidayStatistics(year: number): Promise<any> {
		const startDate = new Date(year, 0, 1);
		const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

		const holidays = await this.holidayModel.find({
			startDate: { $lte: endDate },
			endDate: { $gte: startDate },
			isActive: true,
		});
		const statistics: Record<HolidayType, { count: number; totalDays: number }> = {
			[HolidayType.PUBLIC_HOLIDAY]: { count: 0, totalDays: 0 },
			[HolidayType.COMPANY_HOLIDAY]: { count: 0, totalDays: 0 },
			[HolidayType.PERSONAL_LEAVE]: { count: 0, totalDays: 0 },
			[HolidayType.SICK_LEAVE]: { count: 0, totalDays: 0 },
			[HolidayType.ANNUAL_LEAVE]: { count: 0, totalDays: 0 },
			[HolidayType.OTHER]: { count: 0, totalDays: 0 },
		};
		for (const holiday of holidays) {
			statistics[holiday.type].count++;
			statistics[holiday.type].totalDays += holiday.daysCount || 0;
		}
		return statistics;
	}
}