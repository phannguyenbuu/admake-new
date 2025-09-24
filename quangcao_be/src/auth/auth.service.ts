import { Inject, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/user/user.entity';
import { Model } from 'mongoose';
import { Request } from 'express';
import { ApiException } from '@libs/common/exception/api.exception';
import { JwtService } from '@nestjs/jwt';
import { REQUEST } from '@nestjs/core';

import { AuthModel } from './models/auth.model';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
	constructor(
		@InjectModel(User.name) private userModel: Model<User>,
		@Inject(REQUEST) private readonly req: Request & { user: User },
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
	) {}

	public async verifyToken(token: string): Promise<{
		sub: string;
		username: string;
		status: string;
		hashKey: string;
	}> {
		// Sử dụng cấu hình JwtModule (secret từ ConfigService) để tránh lệch cấu hình
		const decoded = await this.jwtService.verifyAsync(token,{
			secret: this.configService.getOrThrow('JWT_SECRET'),
		});
		return decoded;
	}

	public async login(dto: Pick<User, 'username' | 'password'>): Promise<AuthModel> {
		const user = await this.userModel.findOne({
			username: dto.username,
			password: dto.password,
		});
		if (!user) throw ApiException.USER_NOT_FOUND;
		const payload = {
			sub: user._id,
			username: user.username,
			status: user.status,
			hashKey: user.hashKey,
		};
		// Ký token dùng cấu hình mặc định từ JwtModule (đã cấu hình bằng ConfigService)
		return {
			access_token: await this.jwtService.signAsync(payload,{
				secret: this.configService.getOrThrow('JWT_SECRET'),
				expiresIn: this.configService.getOrThrow('JWT_EXPIRES_IN'),
			}),
		};
	}

	public async currentUser(): Promise<User> {
		if (this.req.user) {
			return this.req.user;
		}
		try {
			// Chuẩn hóa đọc token theo chuẩn Bearer và fallback query param nếu cần
			let token = this.req.headers.authorization || '';
			if (token.toLowerCase().startsWith('bearer ')) token = token.slice(7);
			else token = token.split(' ')[1] || token; // nếu header chứa dạng khác
			if (!token) {
				// fallback query param (không khuyến khích nhưng hỗ trợ backward-compatible)
				// @ts-ignore
				token = (this.req.query?.authorization as string) || '';
				if (token.toLowerCase().startsWith('bearer ')) token = token.slice(7);
			}
			if (!token) {
				throw ApiException.UNAUTHORIZED;
			}
			const payload = await this.jwtService.verifyAsync(token,{
				secret: this.configService.getOrThrow('JWT_SECRET'),
			});
			if (!payload) throw ApiException.UNAUTHORIZED;
			const user = await this.userModel.findById(payload.sub);
			if (!user) throw ApiException.USER_NOT_FOUND;
			if (user.hashKey !== payload.hashKey) {
				throw ApiException.UNAUTHORIZED;
			}
			this.req.user = user;
			return user;
		} catch (error) {
			if (error instanceof ApiException) {
				throw ApiException.UNAUTHORIZED;
			}
			throw error;
		}
	}
}
