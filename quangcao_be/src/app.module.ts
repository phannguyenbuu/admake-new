import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@libs/common/guards/auth.guard';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth/auth.service';
import { RoleModule } from './role/role.module';
import { MaterialModule } from './material/material.module';
import { SettingModule } from './setting/setting.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { join } from 'path';
import { CustomerModule } from './customer/customer.module';
import { AttendanceModule } from './attendance/attendance.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { NotificationModule } from './notification/notification.module';
import { TaskModule } from './task/task.module';
import { CronService } from './providers/cron.service';
import { AppGateway } from './providers/app.gateway';
import { ScheduleModule } from '@nestjs/schedule';
import { CommentModule } from './comment/comment.module';
import { HolidayModule } from './holiday/holiday.module';
import { AppController } from './controllers/app.controller';
import { ReportModule } from './report/report.module';
import { QuotationService } from './providers/quotation.service';
import { AttendanceReportService } from './providers/attendanceReport.service';
import { GoongService } from './providers/goong.service';
import { GlobalModule } from './providers/global.module';
@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		EventEmitterModule.forRoot({
			wildcard: true,
			global: true,
		}),
		ServeStaticModule.forRoot({
			rootPath: join(process.cwd(), 'uploads'),
			serveRoot: '/static',
		}),
		ScheduleModule.forRoot({
			cronJobs: true,
			intervals: true,
			timeouts: true,
		}),
		MongooseModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				uri: configService.getOrThrow('MONGO_URI'),
				dbName: configService.getOrThrow('MONGO_DB'),
				connectionFactory: (connection) => {
					connection.plugin(require('mongoose-autopopulate'));
					return connection;
				},
			}),
		}),
		UserModule,
		AuthModule,
		RoleModule,
		MaterialModule,
		SettingModule,
		CustomerModule,
		AttendanceModule,
		WorkspaceModule,
		NotificationModule,
		TaskModule,
		CommentModule,
		HolidayModule,
		ReportModule,
		GlobalModule,
	],
	controllers: [AppController],
	providers: [AuthGuard, CronService, AppGateway, QuotationService,GoongService],
})
export class AppModule {}		
