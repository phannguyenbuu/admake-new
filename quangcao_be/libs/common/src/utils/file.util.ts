import { BufferFile, File } from '../@types/utils';
import { join } from 'path';
import { unlink, writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { existsSync, mkdirSync } from 'fs';

export class FileUtil {
	private static readonly UPLOADS_PATH = join(process.cwd(), 'uploads');
	static async SaveFileBuffer(
		file: BufferFile,
		options: {
			randomName?: boolean;
			extension?: string;
			destination?: string;
		},
	) {
		let name = file.originalname;
		if (options.randomName) {
			const ext = options.extension ?? file.originalname.split('.')[file.originalname.split('.').length - 1];
			name = `${uuidv4()}.${ext}`;
		}
		if (!existsSync(join(this.UPLOADS_PATH, options.destination ?? ''))) {
			mkdirSync(join(this.UPLOADS_PATH, options.destination ?? ''), {
				recursive: true,
			});
		}
		const path = join(this.UPLOADS_PATH, options.destination ?? '', name);
		// await writeFile(path, file.buffer);
		await writeFile(path, new Uint8Array(file.buffer.buffer, file.buffer.byteOffset, file.buffer.byteLength));

		return path.replace(this.UPLOADS_PATH, '');
	}

	static async RemoveFile(path: string) {
		await unlink(join(this.UPLOADS_PATH, path));
	}
}
