import { Module } from '@nestjs/common';
import { GoongService } from './goong.service';

@Module({
	providers: [GoongService],
	exports: [GoongService],
})
export class GlobalModule {}