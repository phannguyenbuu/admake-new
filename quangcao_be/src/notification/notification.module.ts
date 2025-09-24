import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from './notification.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
	imports: [MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }]), AuthModule],
	controllers: [NotificationController],
	providers: [NotificationService],
	exports: [NotificationService],
})
export class NotificationModule {}
