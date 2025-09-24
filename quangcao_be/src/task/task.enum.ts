export enum TaskStatus {
	// phân việc , thực hiện , hoàn thành , khoán thưởng , hủy , tạm dừng
	OPEN = 'OPEN',
	IN_PROGRESS = 'IN_PROGRESS',
	DONE = 'DONE',
	REWARD = 'REWARD',
	CANCEL = 'CANCEL',
	PAUSE = 'PAUSE',
}

export enum TaskType {
	// Công khoán , công tháng
	REWARD = 'REWARD',
	MONTHLY = 'MONTHLY',
}
