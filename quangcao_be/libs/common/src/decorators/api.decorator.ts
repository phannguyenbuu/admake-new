import { applyDecorators, Controller, SetMetadata, Type, UseGuards, UseInterceptors } from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiConsumes,
	ApiBody,
	ApiOperation,
	ApiResponse,
	ApiTags,
	ApiUnauthorizedResponse,
	getSchemaPath,
} from '@nestjs/swagger';
import { IS_PUBLIC_KEY } from '../config/constant';
import { AuthGuard } from '../guards/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

export function ApiController(path: string) {
	return applyDecorators(Controller(path), ApiTags(path), UseGuards(AuthGuard), ApiBearerAuth());
}

export function ApiPage<T>(entity: new () => T) {
	return applyDecorators(
		ApiResponse({
			schema: {
				type: 'object',
				properties: {
					data: {
						type: 'array',
						items: { $ref: getSchemaPath(entity) },
					},
					total: {
						type: 'number',
					},
					page: {
						type: 'number',
					},
					limit: {
						type: 'number',
					},
					totalPages: {
						type: 'number',
					},
				},
			},
		}),
	);
}

export function ApiNote(note: string) {
	return applyDecorators(ApiOperation({ summary: note }), ApiBearerAuth());
}

export function ApiModel(model: Type | [Type]) {
	const isArray = Array.isArray(model);
	const type = isArray ? model[0] : model;
	const typeName = Math.random().toString(36).substring(2, 15);
	type.prototype.name = typeName;
	return applyDecorators(ApiResponse({ type: type, isArray: isArray }));
}

export function ApiPublic() {
	return applyDecorators(ApiUnauthorizedResponse({ description: 'Unauthorized' }), SetMetadata(IS_PUBLIC_KEY, true));
}

export function ApiFile(name: string, options?: Parameters<typeof FileInterceptor>[1]) {
	return applyDecorators(
		ApiConsumes('multipart/form-data'),
		UseInterceptors(
			FileInterceptor(name, {
				storage: memoryStorage(),
				...options,
			}),
		),
	);
}
