
'use client';

import io from 'socket.io-client';
const API_URL = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3000` : '';







type SocketType = ReturnType<typeof io>;

let socket: SocketType | null = null;

/**
 * Подключает WebSocket-соединение (singleton).
 */
export function connectSocket(userId: number, role: string): SocketType {
  if (typeof window === 'undefined') {
    throw new Error('WebSocket недоступен на сервере');
  }

  if (!socket) {
    const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/^http/, 'ws') || '';
    socket = io(SOCKET_URL, {
      query: { userId: String(userId), role },
    });
  }

  return socket;
}

/**
 * Возвращает текущее активное WebSocket-соединение.
 */
export function getSocket(): SocketType | null {
  return socket;
}

/**
 * Отключает WebSocket при необходимости.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}


















