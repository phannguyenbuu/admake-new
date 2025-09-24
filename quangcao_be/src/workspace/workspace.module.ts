import { Module } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { AuthModule } from 'src/auth/auth.module';
import { Workspace, WorkspaceSchema } from './workspace.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskModule } from 'src/task/task.module';

@Module({
	imports: [AuthModule, TaskModule, MongooseModule.forFeature([{ name: Workspace.name, schema: WorkspaceSchema }])],
	controllers: [WorkspaceController],
	providers: [WorkspaceService],
	exports: [WorkspaceService],
})
export class WorkspaceModule {}
