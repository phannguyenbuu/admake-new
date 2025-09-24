import { Module } from '@nestjs/common';
import { Holiday, HolidaySchema } from './holiday.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { HolidayController } from './holiday.controller';
import { HolidayService } from './holiday.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
	imports: [AuthModule, MongooseModule.forFeature([{ name: Holiday.name, schema: HolidaySchema }])],
	controllers: [HolidayController],
	providers: [HolidayService],
	exports: [HolidayService],
})
export class HolidayModule {}