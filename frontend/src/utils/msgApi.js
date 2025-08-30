// src/utils/msgApi.js
import api from './api';

/** Conversations */
export const listConversations = () =>
  api.get('/messages/conversations');

export const openOrCreateDM = (userId) =>
  api.post('/messages/conversations', { userId });

/** Optional helper (not strictly needed by your current UI).
 * If you don’t have a dedicated GET /messages/conversations/:id,
 * you can derive details from listConversations() instead. */
export const getConversation = async (id) => {
  const r = await listConversations();
  const data = Array.isArray(r.data) ? r.data : [];
  return { data: data.find(c => String(c._id) === String(id)) || null };
};

/** Messages */
export const listMessages = (conversationId, since) =>
  api.get(`/messages/conversations/${conversationId}/messages`, {
    params: since ? { since } : {},
  });

export const sendMessage = (conversationId, text) =>
  api.post(`/messages/conversations/${conversationId}/messages`, { text });

/** User search (if your backend exposes one; safe no-op if unused) */
// src/utils/msgApi.js  (only the searchUsers line shown here)
export const searchUsers = (q) =>
  api.get('/messages/search-users', { params: { q } }).catch(() => ({ data: [] }));


/** Default export (to satisfy the linter rule about anonymous default exports) */
const msgApi = {
  listConversations,
  openOrCreateDM,
  getConversation,
  listMessages,
  sendMessage,
  searchUsers,
};
export default {
  listConversations, openOrCreateDM, listMessages, sendMessage, searchUsers
};
