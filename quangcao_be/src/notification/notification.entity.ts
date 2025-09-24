import { DocumentBase } from '@libs/common/base/document.base';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { User } from 'src/user/user.entity';
import { NotificationType } from './notification.enum';
import { ApiExtraModels } from '@nestjs/swagger';

@Schema({
	timestamps: true,
})
@ApiExtraModels(User)
export class Notification extends DocumentBase {
    static readonly notiCreateEvent = 'notification.create';

	
	@Prop({ type: Types.ObjectId, ref: User.name , required:true })
	userId: Types.ObjectId;

	@Prop({ type: Types.ObjectId, ref: User.name , required:true })
	fromUserId: Types.ObjectId;

	@Prop({ type: String })
	title: string;

	@Prop({ type: String })
	message: string;

	@Prop({ type: String })
	type: NotificationType;

	@Prop({ type: String })
	data: string;

	@Prop({ type: Boolean, default: false })
	isRead: boolean;

	user: User;

	fromUser: User;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
