import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from 'src/notification/notification.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AppEvent {
	constructor(
		private readonly notificationService: NotificationService,
		private readonly userService: UserService,
		private readonly eventEmitter: EventEmitter2,
	) {}

	
}
