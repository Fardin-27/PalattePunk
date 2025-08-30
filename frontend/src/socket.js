// src/socket.js
import { io } from 'socket.io-client';
export function makeSocket() {
  const token = localStorage.getItem('token');
  return io('http://localhost:5000', {
    transports: ['websocket'],
    withCredentials: true,
    auth: { token },
  });
}
