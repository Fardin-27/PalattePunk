// src/pages/Notifications.js
import React, { useEffect, useState, useCallback } from 'react';
import { listNotifications, markNotificationRead, markAllNotificationsRead } from '../utils/notifyApi';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setErr('');
      const res = await listNotifications(1, 50);
      const arr = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : [];
      setItems(arr);
    } catch (e) {
      console.error('Notifications load error:', e?.response?.data || e.message);
      setErr('Failed to load notifications');
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000); // auto refresh every 15s
    return () => clearInterval(t);
  }, [load]);

  const onRead = async (id) => {
    try {
      await markNotificationRead(id);
      setItems((prev) => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error('mark read error', e);
    }
  };

  const onReadAll = async () => {
    try {
      setBusy(true);
      await markAllNotificationsRead();
      setItems((prev) => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error('mark all read error', e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Notifications</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className="btn primary" onClick={load} disabled={busy}>Refresh</button>
        <button className="btn" onClick={onReadAll} disabled={busy}>Mark all read</button>
      </div>

      {err ? <p className="error">{err}</p> : null}

      {!err && items.length === 0 && (
        <p className="muted">No notifications yet.</p>
      )}

      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 10 }}>
        {items.map((n) => (
          <li
            key={n._id}
            style={{
              border: '1px solid #eee',
              borderRadius: 10,
              padding: '10px 12px',
              background: n.isRead ? '#fafafa' : '#fff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <b>{n.title || n.type || 'Notification'}</b>
                <div style={{ color: '#555' }}>{n.body || ''}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: '#777' }}>
                  {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                </div>
                {!n.isRead && (
                  <button className="btn small" onClick={() => onRead(n._id)} style={{ marginTop: 6 }}>
                    Mark read
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
