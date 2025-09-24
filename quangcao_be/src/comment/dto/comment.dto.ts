import { PickType } from '@nestjs/swagger';
import { Comment } from '../comment.entity';

export class CreateCommentDto extends PickType(Comment, ['content', 'image']) {}
