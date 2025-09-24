import { HttpException, HttpStatus } from '@nestjs/common';
import { ListException } from '../decorators/exception.decorator';

@ListException()
export class ApiException extends HttpException {
	private code: string;
	public setCode(code: string) {
		this.code = code;
	}
	public getCode() {
		return this.code; 
	}
	static UNAUTHORIZED = new ApiException('Bạn không có quyền truy cập', HttpStatus.UNAUTHORIZED);
	static FORBIDDEN = new ApiException('Bạn không có quyền truy cập', HttpStatus.FORBIDDEN);
	static NOT_FOUND = new ApiException('Không tìm thấy', HttpStatus.NOT_FOUND);
	static BAD_REQUEST = new ApiException('Yêu cầu không hợp lệ', HttpStatus.BAD_REQUEST);
	static INTERNAL_SERVER_ERROR = new ApiException('Lỗi server', HttpStatus.INTERNAL_SERVER_ERROR);
	static SERVICE_UNAVAILABLE = new ApiException('Dịch vụ không khả dụng', HttpStatus.SERVICE_UNAVAILABLE);
	static GATEWAY_TIMEOUT = new ApiException('Thời gian chờ hết hạn', HttpStatus.GATEWAY_TIMEOUT);
	static PRECONDITION_FAILED = new ApiException('Precondition Failed', HttpStatus.PRECONDITION_FAILED);
	static PAYLOAD_TOO_LARGE = new ApiException('Dữ liệu quá lớn', HttpStatus.PAYLOAD_TOO_LARGE);
	static UNPROCESSABLE_ENTITY = new ApiException('Dữ liệu không hợp lệ', HttpStatus.UNPROCESSABLE_ENTITY);
	static IMAGE_REQUIRED = new ApiException('Ảnh không được để trống', HttpStatus.BAD_REQUEST);
	/**
	 * user
	 */
	static USER_NOT_FOUND = new ApiException('Người dùng không tồn tại', HttpStatus.NOT_FOUND);
	static USER_ALREADY_EXISTS = new ApiException('Người dùng đã tồn tại', HttpStatus.BAD_REQUEST);
	static USER_NOT_READY = new ApiException('Người dùng chưa sẵn sàng', HttpStatus.BAD_REQUEST);
	/**
	 * setting
	 */
	static SETTING_INVALID = new ApiException('Cấu hình không hợp lệ', HttpStatus.BAD_REQUEST);

	/**
	 * customer
	 */
	static CUSTOMER_NOT_FOUND = new ApiException('Khách hàng không tồn tại', HttpStatus.NOT_FOUND);
	static CUSTOMER_ALREADY_EXISTS = new ApiException('Khách hàng đã tồn tại', HttpStatus.BAD_REQUEST);

	/**
	 * attendance
	 */
	static ATTENDANCE_NOT_FOUND = new ApiException('Lịch chấm công không tồn tại', HttpStatus.NOT_FOUND);
	static ATTENDANCE_ALREADY_EXISTS = new ApiException('Lịch chấm công đã tồn tại', HttpStatus.BAD_REQUEST);
	/**
	 * role
	 */
	static ROLE_NOT_FOUND = new ApiException('Vai trò không tồn tại', HttpStatus.NOT_FOUND);
	/**
	 * material
	 */
	static MATERIAL_NOT_FOUND = new ApiException('Vật tư không tồn tại', HttpStatus.NOT_FOUND);
	/**
	 * workspace
	 */
	static WORKSPACE_NOT_FOUND = new ApiException('Không gian làm việc không tồn tại', HttpStatus.NOT_FOUND);

	/**
	 * task
	 */
	static TASK_NOT_FOUND = new ApiException('Công việc không tồn tại', HttpStatus.NOT_FOUND);
	static TASK_REWARD_NOT_FOUND = new ApiException('Công việc đã được thưởng', HttpStatus.NOT_FOUND);
	static TASK_MATERIAL_NOT_ENOUGH = new ApiException('Vật tư không đủ', HttpStatus.BAD_REQUEST);

	/**
	 * workspace
	 */
	static WORKSPACE_ALREADY_EXISTS = new ApiException('Không gian làm việc đã tồn tại', HttpStatus.BAD_REQUEST);

	/**
	 * comment
	 */
	static COMMENT_NOT_FOUND = new ApiException('Bình luận không tồn tại', HttpStatus.NOT_FOUND);

	/**
	 * holiday
	 */
	static HOLIDAY_NOT_FOUND = new ApiException('Ngày nghỉ không tồn tại', HttpStatus.NOT_FOUND);
	static HOLIDAY_ALREADY_EXISTS = new ApiException('Ngày nghỉ đã tồn tại', HttpStatus.BAD_REQUEST);
	static HOLIDAY_CONFLICT = new ApiException('Ngày nghỉ bị xung đột', HttpStatus.BAD_REQUEST);
	static HOLIDAY_FROM_DATE_INVALID = new ApiException('Ngày bắt đầu không hợp lệ', HttpStatus.BAD_REQUEST);
	static HOLIDAY_TO_DATE_INVALID = new ApiException('Ngày kết thúc không hợp lệ', HttpStatus.BAD_REQUEST);
}
