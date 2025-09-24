import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import '@libs/common/extensions';
import { AppConfig } from '@libs/common/config/app';
async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	AppConfig.useApp(app);
	await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
