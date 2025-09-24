import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

export class SwaggerConfig {
	static useSwagger(app: INestApplication) {
		const config = new DocumentBuilder()
			.setTitle('Adsmake API')
			.setDescription('Adsmake API description')
			.setVersion('1.0')
			.addBearerAuth()
			.build();
		const configService = app.get(ConfigService);
		const document = SwaggerModule.createDocument(app, config);
		SwaggerModule.setup('api', app, document, {
			swaggerOptions: {
				persistAuthorization: true,
			},
		});
		console.log(`Swagger is running on http://localhost:${configService.get('PORT')}/api`);
	}
}
