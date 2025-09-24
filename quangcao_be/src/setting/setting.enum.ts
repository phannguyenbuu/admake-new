import { Type } from '@nestjs/common';
import { Types } from 'mongoose';

export enum SettingKey {
	// thứ hạn lương
	SALARY_LEVEL = 'salary_level',
	// lương tăng ca (hành chính)
	SALARY_OVERTIME = 'salary_overtime',
	// lương tăng ca khoán
	SALARY_OVERTIME_FIXED = 'salary_overtime_fixed',
	// ngày chốt công
	PAYROLL_DATE = 'payroll_date',
	// ngày công chuẩn
	STANDARD_WORKING_DAYS = 'standard_working_days',
}



export type SettingValueTypes = {
	[SettingKey.SALARY_LEVEL]: {
		id: Types.ObjectId;
		salary: number;
		index: number;
	}[];
	[SettingKey.SALARY_OVERTIME]: number;
	[SettingKey.SALARY_OVERTIME_FIXED]: number;
	[SettingKey.PAYROLL_DATE]: number;
	[SettingKey.STANDARD_WORKING_DAYS]: {
		[key: string]: {
			year: number;
			month: number;
			days: number; // số ngày công chuẩn
		};
	};
};

export const settingValueValidator: Record<SettingKey, (value: SettingValueTypes[SettingKey]) => boolean> = {
	[SettingKey.SALARY_LEVEL]: (value: SettingValueTypes[SettingKey.SALARY_LEVEL]) => {
		return value
			.every((item) => item.salary && item.index)
	},
	[SettingKey.SALARY_OVERTIME]: (value: SettingValueTypes[SettingKey.SALARY_OVERTIME]) => {
		return typeof value === 'number';
	},
	[SettingKey.SALARY_OVERTIME_FIXED]: (value: SettingValueTypes[SettingKey.SALARY_OVERTIME_FIXED]) => {
		return typeof value === 'number';
	},
	[SettingKey.PAYROLL_DATE]: (value: SettingValueTypes[SettingKey.PAYROLL_DATE]) => {
		return typeof value === 'number' && value > 0 && value < 32;
	},
	[SettingKey.STANDARD_WORKING_DAYS]: (value: SettingValueTypes[SettingKey.STANDARD_WORKING_DAYS]) => {
		// {
		// 	[key: string]: {
		// 		year: number;
		// 		month: number;
		// 		days: number; // số ngày công chuẩn
		// 	};
		// }
		// valid object key is format YYYY-MM
		return Object.keys(value).every(key => {
			const [year, month] = key.split('-');
			return year && month && Number(year) > 0 && Number(month) > 0 && Number(month) < 13 && value[key].days > 0 && value[key].days < 32 && Number.isInteger(value[key].days);
		});
	},
};
