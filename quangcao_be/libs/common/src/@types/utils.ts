export type File = Express.Multer.File;
export type KeyOf<T> = keyof T;
export type SortOrder = 'asc' | 'desc';
export type SortOf<T> = {
	[K in keyof T]?: SortOrder;
};
export type BufferFile = Pick<File, 'buffer' | 'originalname' | 'mimetype' | 'fieldname' | 'encoding' | 'size'>;
