import { INestApplication, ValidationPipe } from '@nestjs/common';

import { SwaggerConfig } from './swagger';
import { AllExceptionsFilter } from '../filters/all-exceptions.filter';

export class AppConfig {
	static useApp(app: INestApplication) {
		app.enableCors();
		app.useGlobalPipes(
			new ValidationPipe({
				whitelist: true,
				forbidNonWhitelisted: false,
				transform: true,
			}),
		);
		SwaggerConfig.useSwagger(app);
		app.useGlobalFilters(new AllExceptionsFilter());
	}
}
