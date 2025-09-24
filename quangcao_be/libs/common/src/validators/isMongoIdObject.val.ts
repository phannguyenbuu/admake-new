import {
	registerDecorator,
	ValidationOptions,
	ValidatorConstraint,
	ValidatorConstraintInterface,
} from 'class-validator';
import { Types } from 'mongoose';

export function IsMongoIdObject(validationOptions?: ValidationOptions) {
	return function (object: object, propertyName: string) {
		registerDecorator({
			target: object.constructor,
			propertyName: propertyName,
			options: validationOptions,
			validator: IsMongoIdObjectObjectValidator,
		});
	};
}

export class IsMongoIdObjectObjectValidator implements ValidatorConstraintInterface {
	validate(value: string | Types.ObjectId | string[] | Types.ObjectId[]) {
		if (Array.isArray(value)) {
			return value.every((id) => Types.ObjectId.isValid(id));
		}
		return Types.ObjectId.isValid(value);
	}

	defaultMessage() {
		return 'ID phải là một chuỗi hoặc một mảng chuỗi';
	}
}
