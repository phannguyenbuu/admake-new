import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { ApiException } from '../exception/api.exception';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse();
		const request = ctx.getRequest();
		const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
		const message = exception instanceof HttpException ? exception.getResponse() : 'Internal server error';
		console.log(exception);
		if (exception instanceof ApiException) {
			response.status(status).json({
				statusCode: status,
				timestamp: new Date().toISOString(),
				path: request.url,
				message: exception.message,
				code: exception.getCode(),
			});
		} else {
			response.status(status).json({
				statusCode: status,
				timestamp: new Date().toISOString(),
				path: request.url,
				message: message,
			});
		}
	}
}
