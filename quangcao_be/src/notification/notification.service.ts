import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Notification } from './notification.entity';
import { ServiceBase } from '@libs/common/base/service.base';
import { SortOf } from '@libs/common/@types/utils';
import { PaginationDto } from '@libs/common/dto/pagination.dto';
import { Page } from '@libs/common/struct/page';
import { User } from 'src/user/user.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiException } from '@libs/common/exception/api.exception';
import { Task } from 'src/task/task.entity';

@Injectable()
export class NotificationService extends ServiceBase<Notification> {
	constructor(
		@InjectModel(Notification.name) notificationModel: Model<Notification>,
		private readonly eventEmitter: EventEmitter2
	) {
		super(notificationModel);
	}

	public async findPage(
		dto: PaginationDto,
		keyOfSearch?: (keyof Notification)[],
		query?: FilterQuery<Notification>,
		sort?: SortOf<Notification>,
	): Promise<Page<Notification>> {
		const data = await super.findPage(dto, keyOfSearch, query, sort);
		const unread = await this.count({
			...query,
			isRead: false,
		});
		data.addMeta('unread', unread);
		return data;
	}

	public async getDetail(id:Types.ObjectId) {
		return await this.model.findById(id).populate('userId',{
			password:false,
			role:false,
		},'user').populate('fromUserId',{
			password:false,
			role:false,
		},'fromUser');
	}


    public async sendNotification(from:User,to:User,title:string,content:string) {
		const noti = await this.create({
			userId: to._id,
			fromUserId: from._id,
			title: title,
            message: content,
		});
		this.eventEmitter.emit(Notification.notiCreateEvent, noti);
	}

	public async createTaskNoti(task:Task) {
		const users = task.assigns;
		const user = task.createBy;

		for (const user of users) {
			await this.sendNotification(user, user, 'Vừa có task mới', 'Bạn có task mới');
		}
	}
}
