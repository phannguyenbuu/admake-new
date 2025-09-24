import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, PipelineStage, Types } from 'mongoose';
import { Comment } from './comment.entity';
import { ServiceBase } from '@libs/common/base/service.base';
import { CreateCommentDto } from './dto/comment.dto';
import { Task } from 'src/task/task.entity';
import { SortOf } from '@libs/common/@types/utils';
import { PaginationDto } from '@libs/common/dto/pagination.dto';
import { Page } from '@libs/common/struct/page';
import { User } from 'src/user/user.entity';
import { ApiException } from '@libs/common/exception/api.exception';
 

@Injectable()
export class CommentService extends ServiceBase<Comment> {
	constructor(@InjectModel(Comment.name) private commentModel: Model<Comment>) {
		super(commentModel);
	}
	private readonly aggregate: PipelineStage[] = [
		{
			$lookup: {
				from: 'users',
				localField: 'createById',
				foreignField: '_id',
				as: 'createBy',
				pipeline: [
					{
						$project: {
							_id: 1,
							fullName: 1,
							username: 1,
							avatar: 1,
							status: 1,
							createdAt: 1,
							updatedAt: 1,
							deletedAt: 1,
						},
					},
				],
			},
		},
		{ $unwind: '$createBy' },
		{
			$lookup: {
				from: 'attendances',
				localField: 'attendanceId',
				foreignField: '_id',
				as: 'attendance',
			},
		},
		{ $unwind: { path: '$attendance', preserveNullAndEmptyArrays: true } },
		{
			$project: {
				attendanceId: 1,
				attendance: 1,
				type: 1,
				_id: 1,
				content: 1,
				image: 1,
				createById: 1,
				createBy: 1,
				taskId: 1,
				createdAt: 1,
				updatedAt: 1,
				deletedAt: 1,
			},
		},
	];
	public async findComment(query: FilterQuery<Comment>, dto: PaginationDto) {
		const { page, limit } = dto;
		const data = await this.commentModel.aggregate([
			{ $match: query },
			{ $sort: { createdAt: -1 } },
			{ $skip: (page - 1) * limit },
			{ $limit: limit },
		]);
		const total = await this.commentModel.countDocuments(query);
		return new Page(data, dto, total);
	}

	public async getDetail(id: Types.ObjectId) {
		const data = await this.model.aggregate([{ $match: { _id: id } }, ...this.aggregate]);
		return data[0];
	}

	public async list(query: FilterQuery<Comment>, dto: PaginationDto) {
		const { page, limit } = dto;
		const data = await this.model.aggregate([
			{ $match: query },
			...this.aggregate,
			{ $sort: { createdAt: -1 } },
			{ $skip: (page - 1) * limit },
			{ $limit: limit },
		]);
		const total = await this.model.countDocuments(query);
		return new Page(data, dto, total);
	}
}
