import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SettingKey, SettingValueTypes } from './setting.enum';
import { DocumentBase } from '@libs/common/base/document.base';

@Schema({ collection: 'settings', timestamps: true })
export class Setting<T extends SettingKey> extends DocumentBase {
	@Prop({ required: true, type: String })
	key: T;

	@Prop({ required: true, type: Object })
	value: SettingValueTypes[T];
}

export const SettingSchema = SchemaFactory.createForClass(Setting);
