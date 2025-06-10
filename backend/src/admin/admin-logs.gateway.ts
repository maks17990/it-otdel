import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';

@WebSocketGateway({
  // "namespace" не поддерживается WsAdapter, используем "path" вместо этого
  path: '/admin/logs', // Фронтенд подключается: ws://host:port/admin/logs
  cors: {
    origin: '*', // Лучше потом ограничить
    credentials: false,
  },
})
export class AdminLogsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    console.log('[WS] /admin/logs initialized');
  }

  handleConnection(client: WebSocket) {
    console.log('[WS] Новый клиент подключился к live-логам');
    // Приветствие (можно удалить по вкусу)
    try {
      client.send('🟢 Live-лог подключен');
    } catch (e) {
      // ignore
    }
  }

  handleDisconnect(client: WebSocket) {
    console.log('[WS] Клиент live-логов отключился');
  }

  // Вызывай этот метод из сервисов для рассылки сообщений по логам
  sendLog(message: string) {
    // Если сервер ещё не инициализирован, просто игнорируем
    if (!this.server) {
      return;
    }
    for (const client of this.server.clients) {
      // У ws есть readyState константы (0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED)
      if (client.readyState === client.OPEN) {
        client.send(message);
      }
    }
  }
}
