import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY, IS_PERMISSION_KEY } from '../config/constant';
import { AuthService } from '../../../../src/auth/auth.service';
import { UserPermission } from '../../../../src/user/user.enum';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private readonly reflector: Reflector, private readonly authService: AuthService) {}
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
			context.getHandler(),
			context.getClass(),
		]);
		if (isPublic) {
			return true;
		}
		const user = await this.authService.currentUser();
		const isPermission = this.reflector.getAllAndOverride<UserPermission[]>(IS_PERMISSION_KEY, [
			context.getHandler(),
			context.getClass(),
		]);
		if (isPermission) {
			return (user.role?.permissions ?? []).some((permission) => isPermission.includes(permission));
		}
		return true;
	}
}
