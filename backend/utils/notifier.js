// backend/utils/notifier.js
const Notification = require('../models/Notification');

/**
 * Create a notification for a user.
 * Non-blocking recommended: notify(...).catch(()=>{})
 *
 * @param {string} userId - Mongo ObjectId string
 * @param {string} title
 * @param {string} body
 * @param {string} [type='info'] - e.g. 'info' | 'role' | 'purchase'
 * @param {object} [meta={}]
 * @returns {Promise<Notification>}
 */
async function notify(userId, title, body, type = 'info', meta = {}) {
  if (!userId || !title) return null;
  return Notification.create({ user: userId, title, body, type, meta });
}

module.exports = { notify };
