declare global {
	interface Promise<T> {
		orThrow(error: Error): Promise<NonNullable<T>>;
		empty(error: Error): Promise<T>;
		notNull(error: Error): Promise<NonNullable<T>>;
		exists(error: Error): Promise<NonNullable<T>>;
	}
}

Promise.prototype.orThrow = async function <T>(error: Error): Promise<NonNullable<T>> {
	const data = await this;
	if (!data) {
		throw error;
	}
	return data as NonNullable<T>;
};

Promise.prototype.empty = async function <T>(error: Error): Promise<T> {
	const data = await this;
	if (data || (Array.isArray(data) && data.length > 0)) {
		return data as T;
	}
	throw error;
};

Promise.prototype.notNull = async function <T>(error: Error): Promise<NonNullable<T>> {
	const data = await this;
	if (data && data !== null && data !== undefined) {
		return data as NonNullable<T>;
	}
	throw error;
};

Promise.prototype.exists = async function <T>(error: Error): Promise<NonNullable<T> | null> {
	const data = await this;
	if (data && data !== null && data !== undefined) {
		throw error;
	}
	return null;
};

export {};
