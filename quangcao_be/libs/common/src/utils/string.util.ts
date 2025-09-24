import * as jwt from 'jsonwebtoken';

export class StringUtil {
	static async genToken(payload: { role: string; id: string }): Promise<string> {
		return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1h' });
	}

	static async verifyToken(token: string): Promise<{ role: string; id: string }> {
		return jwt.verify(token, process.env.JWT_SECRET!) as {
			role: string;
			id: string;
		};
	}

	static padLeft(value: number, length: number): string {
		return value.toString().padStart(length, '0');
	}

	static padRight(value: number, length: number): string {
		return value.toString().padEnd(length, '0');
	}
}
