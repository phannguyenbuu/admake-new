import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
	MessageBody,
	ConnectedSocket,
	OnGatewayInit,
	OnGatewayConnection,
	OnGatewayDisconnect,
} from '@nestjs/websockets';
import { DefaultEventsMap, Server, Socket } from 'socket.io';
import { Inject, Logger } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/user.entity';
import { REQUEST } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from 'src/notification/notification.service';
import { Notification } from 'src/notification/notification.entity';

type SocketClient = Socket<
	DefaultEventsMap,
	DefaultEventsMap,
	DefaultEventsMap,
	{
		user: User;
	}
>;

@WebSocketGateway({
	cors: {
		origin: '*',
	},
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
	constructor(
		private readonly userService: UserService,
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
		private readonly eventEmitter: EventEmitter2,
		private readonly notificationService: NotificationService,
	) {}

	@WebSocketServer()
	private readonly server: Server;

    async handleConnection(client: SocketClient) {
		try {
            // Ưu tiên chuẩn Bearer từ header
            let token = (client.handshake.headers.authorization as string) || '';
            if (typeof token === 'string' && token.toLowerCase().startsWith('bearer ')) {
                token = token.slice(7);
            }
            if (!token || token.length < 10) {
                // Fallback query string ?authorization=Bearer xxx hoặc xxx
                const q = client.handshake.query.authorization as string;
                token = q || '';
                if (token.toLowerCase().startsWith('bearer ')) token = token.slice(7);
            }
			if (!token || token.length < 10) {
				client.disconnect();
				return;
			}
			const decoded = await this.jwtService.verifyAsync(token, {
				secret: this.configService.getOrThrow('JWT_SECRET'),
			});
			const user = await this.userService.findById(decoded.sub);
			if (!user) {
				client.disconnect();
				return;
			}
			client.data = {
				user: user,
			};
			client.join(user._id.toString());
            for (const permission of (user.role?.permissions ?? [])) {
				client.join(permission.toString());
			}
		} catch (error) {
			client.disconnect();
		}
	}

    handleDisconnect(client: SocketClient) {
        const user = client.data.user;
        if(!user || !user._id) return;
        client.leave(user._id.toString());
        for (const permission of (user.role?.permissions ?? [])) {
            client.leave(permission.toString());
        }
    }


	@OnEvent(Notification.notiCreateEvent)
	handleNotificationCreate(noti: Notification) {
		const topic = noti.userId.toString();
		this.server.to(topic).emit('notification', noti);
		console.log('handleNotificationCreate', noti);
	}	
}
