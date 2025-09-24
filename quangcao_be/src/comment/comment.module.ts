import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Comment, CommentSchema } from './comment.entity';

@Module({
	imports: [MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }])],
	controllers: [],
	providers: [CommentService],
	exports: [CommentService],
})
export class CommentModule {}
