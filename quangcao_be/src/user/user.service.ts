import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { User } from './user.entity';
import { UserPermission, UserState, UserStatus, UserType } from './user.enum';
import { ServiceBase } from '@libs/common/base/service.base';
import { Role } from 'src/role/role.entity';

@Injectable()
export class UserService extends ServiceBase<User> {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(Role.name) private roleModel: Model<Role>,
    ) {
        super(userModel);
    }

    async createDefaultAdmin() {
        // Lấy role quản trị nếu có, nếu chưa có thì tạo mới nhanh
        let adminRole = await this.roleModel.findOne({ name: 'Quản trị viên' });
        if (!adminRole) {
            adminRole = await this.roleModel.create({
                name: 'Quản trị viên',
                permissions: Object.values(UserPermission),
            } as Partial<Role>);
        }

        const username = process.env.DEFAULT_ADMIN_USER || 'admin';
        const password = process.env.DEFAULT_ADMIN_PASS || 'admin@123';

        const existing = await this.userModel.findOne({ username, deletedAt: null });
        if (existing) return existing;

        const user = new this.userModel({
            username,
            password, // theo yêu cầu: không mã hóa mật khẩu
            status: UserStatus.ACTIVE,
            type: UserType.EMPLOYEE,
            state: UserState.WORKING,
            role: adminRole._id,
        });
        return user.save();
    }

	async findByUsername(username: string) {
		return this.findOne({ username });
	}

    async findAllAndRole(query?: FilterQuery<User>) {
        return this.userModel.aggregate<User & { role: Role }>([
            {
                $match: {
                    deletedAt: null,
                    ...query
                }
            },
            {
                $lookup: {
                    from: 'roles',
                    localField: 'role',
                    foreignField: '_id',
                    as: 'role'
                }
            },
            {
                $unwind: '$role'
            }
        ]);
    }
}
