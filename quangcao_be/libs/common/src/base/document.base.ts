import { Prop } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export class DocumentBase extends Document {
	_id?: Types.ObjectId;

	createdAt: Date;
	updatedAt: Date;

	@Prop({ default: null })
	deletedAt?: Date;

	static get path() {
		return this.name
			.toLowerCase()
			.replace(/s$/, '')
			.replace(/^./, (char) => char.toLowerCase());
	}
}
