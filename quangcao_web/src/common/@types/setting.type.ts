import type { BaseEntity } from "./common.type";

// Salary level item structure
export type SalaryLevelItem = {
  id?: string;
  salary: number;
  index: number;
};

// Setting key enum
export type SettingKey =
  | "salary_level"
  | "salary_overtime"
  | "salary_overtime_fixed"
  | "payroll_date"
  | "standard_working_days";

// Setting value can be different types based on key
export type SettingValue = SalaryLevelItem[] | number;

// Main Setting type
export type Setting = BaseEntity & {
  key: SettingKey;
  value: SettingValue;
};

// DTO for creating/updating settings
export type SettingDto = {
  key: SettingKey;
  value: SettingValue;
};

export type StandardWorkingDaysDto = {
  standardWorkingDays: number;
  year: number;
  month: number;
};

export interface SalaryLevelModalProps {
  open: boolean;
  onCancel: () => void;
  refetchSettings: () => void;
  currentSalaryLevels?: SalaryLevelItem[];
}

export type StandardWorkingDaysMap = {
  [monthKey: string]: { year: number; month: number; days: number };
};
