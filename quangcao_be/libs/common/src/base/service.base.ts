import { ClientSession, FilterQuery, Model, SortOrder, Types } from 'mongoose';
import { PaginationDto } from '../dto/pagination.dto';
import { Page } from '../struct/page';
import { KeyOf, SortOf } from '../@types/utils';
import { DocumentBase } from './document.base';
import { Logger } from '@nestjs/common';
import { da } from '@faker-js/faker/.';

export class ServiceBase<T extends DocumentBase> {
	constructor(private readonly _model: Model<T>) {
		this._model = _model;
	}
	protected logger = new Logger(this.constructor.name);
	public get model(): Model<T> {
		return this._model;
	}

	public async findPage(
		dto: PaginationDto,
		keyOfSearch: KeyOf<T>[] = [],
		query: FilterQuery<T> = {},
		sort: SortOf<T> = { createdAt: 'desc' },
		
	) {
		const { page, limit, search } = dto;
		const filter: FilterQuery<T> = { ...query, deletedAt: null };
		if (search && search.length > 0) {
			filter.$or = keyOfSearch.map((key) => {
				return {
					[key as string]: { $regex: search, $options: 'i' },
				} as FilterQuery<T>;
			});
		}
		
		const total = await this._model.countDocuments(filter);


		

		const data = await this._model
			.find(filter)
			.collation({ locale: 'vi' ,strength:1 })
			.skip((page - 1) * limit)
			.limit(limit)
			.sort(sort as unknown as [string, SortOrder][])
			.exec();

		
		
		return new Page<T>(data as T[], dto, total);
	}

	public async findPageRaw(
		dto: PaginationDto,
		keyOfSearch: KeyOf<T>[] = [],
		query: FilterQuery<T> = {},
		sort: SortOf<T> = { createdAt: 'desc' },
	) {
		const { page, limit, search } = dto;
		const filter: FilterQuery<T> = { ...query, deletedAt: null };
		if (search && search.length > 0) {
			filter.$or = keyOfSearch.map((key) => {
				return {
					[key as string]: { $regex: search, $options: 'i' },
				} as FilterQuery<T>;
			});
		}
		const total = await this._model.countDocuments(filter);
		const data = await this._model
			.find(filter)
			.skip((page - 1) * limit)
			.limit(limit)
			.sort(sort as unknown as [string, SortOrder][])

		return [total,data] as const

	}

    public async findAll(query: FilterQuery<T> = {}) {
        return this._model.find({ ...query, deletedAt: null });
    }

    public async findById(id: string | Types.ObjectId) {
        return this._model.findOne({ _id: id, deletedAt: null });
    }

    public async findOne(filter: FilterQuery<T>) {
        return this._model.findOne({ ...filter, deletedAt: null });
    }
	public async count(filter: FilterQuery<T> = {}) {
		return this._model.countDocuments({ ...filter, deletedAt: null });
	}

	public async create(data: Partial<T> & { [key: string]: any }) {
		return this._model.create(data);
	}

	public async softDelete(id: string | Types.ObjectId) {
		return this._model.updateOne({ _id: id }, { deletedAt: new Date()  });
	}

	public async deleteOne(filter: FilterQuery<T>) {
		return this._model.deleteOne({ ...filter, deletedAt: null });
	}

	public async transaction(callback: (session: ClientSession) => Promise<void>) {
		const session = await this._model.db.startSession();
		session.startTransaction();
		try {
			await callback(session);
			await session.commitTransaction();
		} catch (error) {
			await session.abortTransaction();
			throw error;
		} finally {
			session.endSession();
		}
	}
}
