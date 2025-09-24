import { ApiProperty } from '@nestjs/swagger';

export class AuthModel {
	@ApiProperty({ type: String })
	access_token: string;
}
