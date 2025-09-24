import { Module, OnModuleInit } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from './role.entity';
import { UserPermission } from 'src/user/user.enum';

@Module({
	imports: [MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }])],
	controllers: [RoleController],
	providers: [RoleService],
})
export class RoleModule implements OnModuleInit {
	constructor(private readonly roleService: RoleService) {}
	private readonly DEFAULT_ROLES = [
		{
			name: 'Quản trị viên',
			permissions: [
				UserPermission.USER_MANAGEMENT,
				UserPermission.SETTING_MANAGEMENT,
				UserPermission.CUSTOMER_MANAGEMENT,
				UserPermission.WORK_MANAGEMENT,
				UserPermission.STATISTICS_MANAGEMENT,
				UserPermission.PERMISSION_MANAGEMENT,
				UserPermission.ROLE_MANAGEMENT,
				UserPermission.ACCOUNTING_MANAGEMENT,
				UserPermission.WAREHOUSE_MANAGEMENT,
			],
		},
		{
			name: 'Nhân viên',
			permissions: [
				UserPermission.USER_MANAGEMENT,
				UserPermission.SETTING_MANAGEMENT,
				UserPermission.CUSTOMER_MANAGEMENT,
				UserPermission.WORK_MANAGEMENT,
				UserPermission.STATISTICS_MANAGEMENT,
				UserPermission.PERMISSION_MANAGEMENT,
				UserPermission.ROLE_MANAGEMENT,
				UserPermission.ACCOUNTING_MANAGEMENT,
				UserPermission.WAREHOUSE_MANAGEMENT,
			],
		},
	];
	async onModuleInit() {
		if ((await this.roleService.model.countDocuments()) === 0) {
			await this.roleService.create(this.DEFAULT_ROLES);
		}
	}
}
