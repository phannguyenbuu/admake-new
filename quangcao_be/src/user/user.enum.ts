export enum UserStatus {
	ACTIVE = 'active',
	INACTIVE = 'inactive',
	PENDING = 'pending',
	BLOCKED = 'blocked',
}

export enum UserType {
	// nhân viên tháng
	EMPLOYEE = 'employee',
	// nhân viên khoáng
	EMPLOYEE_LOAN = 'employee_loan',
}

export enum UserState {
	WORKING = 'working',
	CONSTRUCTION = 'construction',
	LEAVE = 'leave',
	RESIGN = 'resign',
}

export enum UserPermission {
	USER_MANAGEMENT = 'user:management', // quản lý người dùng
	SETTING_MANAGEMENT = 'setting:management', // quản lý cài đặt
	CUSTOMER_MANAGEMENT = 'customer:management', // quản lý khách hàng
	WORK_MANAGEMENT = 'work:management', // quản lý công việc
	STATISTICS_MANAGEMENT = 'statistics:management', // quản lý thống kê
	PERMISSION_MANAGEMENT = 'permission:management', // quản lý quyền
	ROLE_MANAGEMENT = 'role:management', // quản lý vai trò
	ACCOUNTING_MANAGEMENT = 'accounting:management', // quản lý kế toán
	WAREHOUSE_MANAGEMENT = 'warehouse:management', // quản lý kho
}

export const UserPermissionLabel = {
	[UserPermission.USER_MANAGEMENT]: 'Quản lý người dùng',
	[UserPermission.SETTING_MANAGEMENT]: 'Quản lý cài đặt',
	[UserPermission.CUSTOMER_MANAGEMENT]: 'Quản lý khách hàng',
	[UserPermission.WORK_MANAGEMENT]: 'Quản lý công việc',
	[UserPermission.STATISTICS_MANAGEMENT]: 'Quản lý thống kê',
	[UserPermission.PERMISSION_MANAGEMENT]: 'Quản lý quyền',
	[UserPermission.ROLE_MANAGEMENT]: 'Quản lý vai trò',
	[UserPermission.ACCOUNTING_MANAGEMENT]: 'Quản lý kế toán',
	[UserPermission.WAREHOUSE_MANAGEMENT]: 'Quản lý kho',
};
