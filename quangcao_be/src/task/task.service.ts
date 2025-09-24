import { Injectable } from '@nestjs/common';
import { Task } from './task.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ServiceBase } from '@libs/common/base/service.base';
import { TaskCreateDto } from './dto/task.dto';
import { User } from 'src/user/user.entity';
import { IdDto } from '@libs/common/dto/id.dto';

@Injectable()
export class TaskService extends ServiceBase<Task> {
	constructor(@InjectModel(Task.name) private taskModel: Model<Task>) {
		super(taskModel);
	}

	async createTask(dto: TaskCreateDto, user: User) {

		const task = new this.taskModel(dto);
		task.createById = user._id!;
		return await task.save();
	}

	async getDetail(dto: IdDto) {
		const task = await this.taskModel.aggregate<Task>([
			{
				$match: {
					_id: dto.id,
				},
			},
			{
				$lookup: {
					from: 'customers',
					localField: 'customerId',
					foreignField: '_id',
					as: 'customer',
				},
			},
			{
				$unwind: '$customer',
			},
			{
				$unwind: {
					path: '$materials',
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$lookup: {
					from: 'materials',
					localField: 'materials.materialId',
					foreignField: '_id',
					as: 'materials.material',
				},
			},
			{
				$unwind: {
					path: '$materials.material',
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$group: {
					_id: '$_id',
					title: { $first: '$title' },
					description: { $first: '$description' },
					status: { $first: '$status' },
					type: { $first: '$type' },
					reward: { $first: '$reward' },
					assignIds: { $first: '$assignIds' },
					workspaceId: { $first: '$workspaceId' },
					customerId: { $first: '$customerId' },
					createById: { $first: '$createById' },
					createdAt: { $first: '$createdAt' },
					updatedAt: { $first: '$updatedAt' },
					deletedAt: { $first: '$deletedAt' },
					customer: { $first: '$customer' },
					materials: { $push: '$materials' },
					assigns: { $first: '$assigns' },
					createBy: { $first: '$createBy' },
					workspace: { $first: '$workspace' },
					startTime: { $first: '$startTime' },
					endTime: { $first: '$endTime' },
				},
			},
			{
				$lookup: {
					from: 'users',
					localField: 'assignIds',
					foreignField: '_id',
					as: 'assigns',
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
			{
				$unwind: '$createBy',
			},
			{
				$lookup: {
					from: 'workspaces',
					localField: 'workspaceId',
					foreignField: '_id',
					as: 'workspace',
				},
			},
			{
				$unwind: '$workspace',
			},
		]);
		return task[0] || null;
	}

	async updateTask(dto: IdDto, body: Partial<TaskCreateDto> & { confirmDate?: Date }) {
		await this.taskModel.findByIdAndUpdate(dto.id, body, { new: true });
		return this.getDetail(dto);
	}

	async groupByStatus(workspaceId: Types.ObjectId) {
		const result = await this.taskModel.aggregate<{ _id: string; count: number; tasks: Task[] }>([
			{
				$match: {
					workspaceId: workspaceId,
				},
			},
			{
				$group: {
					_id: '$status',
					count: { $sum: 1 },
					tasks: { $push: '$$ROOT' },
				},
			},
		]);
		return Object.fromEntries(
			result.map(({ _id, count, tasks }) => [
				_id,
				{
					count: count || 0,
					tasks: tasks || [],
				},
			]),
		);
	}
}
