// src/services/socket.js
// Conexão Socket.IO (tempo real) reutilizável, autenticada pelo mesmo authToken.
import { io } from 'socket.io-client';

// Base da API sem o /api final (o socket fica na raiz do host).
const SOCKET_URL = 'https://geral-agentewhatsappapi.r954jc.easypanel.host';

let socket = null;

export function getSocket() {
  const token = localStorage.getItem('authToken');
  if (!token) return null;
  if (socket && socket.connected) return socket;
  if (!socket) {
    socket = io(SOCKET_URL, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
