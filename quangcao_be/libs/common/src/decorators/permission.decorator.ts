import { SetMetadata } from '@nestjs/common';
import { IS_PERMISSION_KEY } from '../config/constant';

export const RequirePermission = (...permissions: string[]) => SetMetadata(IS_PERMISSION_KEY, permissions);

export const RequirePermissions = RequirePermission;
