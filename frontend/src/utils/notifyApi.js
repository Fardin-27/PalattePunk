// src/utils/notifyApi.js
import api from './api';

// list with optional pagination
export const listNotifications = (page = 1, limit = 50) =>
  api.get('/notifications', { params: { page, limit } });

export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`);

export const markAllNotificationsRead = () => api.patch('/notifications/read-all');

export const createNotification = (payload) => api.post('/notifications', payload); // for quick tests

export const getUnreadCount = () => api.get('/notifications/unread-count');

export default {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  createNotification,
  getUnreadCount,
};
