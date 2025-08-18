// ✅ src/pages/ManageUsers.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import api from '../utils/api';
import './ManageUsers.css';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('All');
  const [status, setStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setErr('');
      const res = await api.get('/admin/users', {
        params: {
          q: q || undefined,
          role: role !== 'All' ? role : undefined,
          status: status !== 'All' ? status : undefined,
        },
      });
      setUsers(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [q, role, status]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const confirmDo = async (msg, fn) => {
    if (!window.confirm(msg)) return;
    await fn();
    fetchUsers();
  };

  const banUser = (id) =>
    confirmDo('Ban this user? They will be blocked from logging in.', async () => {
      await api.patch(`/admin/users/${id}/ban`);
    });

  const unbanUser = (id) =>
    confirmDo('Unban this user?', async () => {
      await api.patch(`/admin/users/${id}/unban`);
    });

  const setUserRole = (id, newRole) =>
    confirmDo(`Change role to ${newRole}?`, async () => {
      await api.patch(`/admin/users/${id}/role`, { role: newRole });
    });

  const filtered = useMemo(() => users, [users]); // server-side filtering already

  return (
    <>
      <h2 style={{ marginBottom: 12 }}>Manage Users</h2>

      <div className="mu-toolbar">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or email…"
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option>All</option>
          <option>Buyer</option>
          <option>Artist</option>
          <option>Admin</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option>All</option>
          <option>active</option>
          <option>banned</option>
        </select>
        <button onClick={fetchUsers}>Refresh</button>
      </div>

      {loading && <p>Loading…</p>}
      {err && <p className="mu-error">{err}</p>}

      {!loading && !err && (
        <div className="mu-table">
          <div className="mu-head mu-row">
            <div>Name</div>
            <div>Email</div>
            <div>Role</div>
            <div>Status</div>
            <div style={{ textAlign: 'right' }}>Actions</div>
          </div>

          {filtered.length === 0 && <div className="mu-empty">No users found.</div>}

          {filtered.map((u) => (
            <div key={u._id} className="mu-row">
              <div className="mu-name">
                <div className="mu-avatar">{(u.name || 'U')[0]}</div>
                <div>
                  <div className="bold">{u.name || '—'}</div>
                  <div className="muted id">{u._id}</div>
                </div>
              </div>
              <div>{u.email}</div>
              <div>
                <span className={`pill r-${(u.role || '').toLowerCase()}`}>{u.role}</span>
              </div>
              <div>
                <span className={`pill s-${u.status}`}>{u.status}</span>
              </div>
              <div className="mu-actions">
                {u.status !== 'banned' ? (
                  <button className="warn" onClick={() => banUser(u._id)}>Ban</button>
                ) : (
                  <button onClick={() => unbanUser(u._id)}>Unban</button>
                )}

                <div className="split">
                  <button onClick={() => setUserRole(u._id, 'Buyer')}>Buyer</button>
                  <button onClick={() => setUserRole(u._id, 'Artist')}>Artist</button>
                  <button onClick={() => setUserRole(u._id, 'Admin')}>Admin</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
