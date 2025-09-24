import { Module, OnModuleInit } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.entity';
import { Role, RoleSchema } from 'src/role/role.entity';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Role.name, schema: RoleSchema },
        ]),
    ],
	controllers: [UserController],
	providers: [UserService],
	exports: [UserService],
})
export class UserModule implements OnModuleInit {
	constructor(private readonly userService: UserService) {}
	async onModuleInit() {
		const count = await this.userService.count();
		if (count === 0) {
			await this.userService.createDefaultAdmin();
		}
	}
}
