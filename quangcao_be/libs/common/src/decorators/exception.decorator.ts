import { Type } from '@nestjs/common';
import { ApiException } from '../exception/api.exception';

export function ListException() {
	return (target: Type<ApiException>) => {
		for (const key in target.prototype) {
			if (
				target.prototype[key] &&
				target.prototype[key] instanceof ApiException &&
				typeof target.prototype[key].getCode === 'function'
			) {
				target.prototype[key].setCode(key);
			}
		}
	};
}
