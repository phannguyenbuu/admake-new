import { Controller, Get, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { ApiController, ApiNote, ApiPage } from '@libs/common/decorators/api.decorator';
import { PaginationDto } from '@libs/common/dto/pagination.dto';
import { AuthService } from 'src/auth/auth.service';
import { Notification } from './notification.entity';

@ApiController(Notification.path)
export class NotificationController {
	constructor(private readonly notificationService: NotificationService, private readonly authService: AuthService) {}

	@Get()
	@ApiNote('Lấy thông báo')
	@ApiPage(Notification)
	async getNoti(@Query() dto: PaginationDto) {
		const user = await this.authService.currentUser();
		return this.notificationService.findPage(dto, [], { userId: user._id }, { createdAt: 'desc' });
	}

	@Get('unread')
	@ApiNote('Đánh dấu thông báo đã đọc')
	async readNoti() {
		const user = await this.authService.currentUser();
		return this.notificationService.model.updateMany({ userId: user._id, isRead: false }, { isRead: true });
	}

	@Get('test-noti')
	@ApiNote('Test noti')
	async testNoti() {
		const user = await this.authService.currentUser();
		await this.notificationService.sendNotification(user, user, 'Test noti', 'Test noti');
	}
}
