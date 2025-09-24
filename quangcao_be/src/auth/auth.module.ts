import { Global, Module, OnModuleInit } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/user/user.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ReportModule } from 'src/report/report.module';
import { HolidayModule } from 'src/holiday/holiday.module';

@Module({
	imports: [

        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                secret: configService.getOrThrow('JWT_SECRET'),
                signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN') ?? '1h' },
            }),
            inject: [ConfigService],
        }),
		MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
		UserModule,
	],
	controllers: [AuthController],
	providers: [AuthService, JwtService],
	exports: [AuthService, JwtService],
})
@Global()
export class AuthModule {
	constructor(private readonly authService: AuthService) {}
}
