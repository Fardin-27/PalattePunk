// ✅ src/pages/AdminUsers.js
import React, { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import './AdminUsers.css';

export default function AdminUsers() {
  const [tab, setTab] = useState('users'); // 'users' | 'requests'
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // Users state
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');   // all | Buyer | Artist | Admin
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | banned

  // Requests state
  const [reqStatus, setReqStatus] = useState('pending'); // pending | approved | rejected
  const [requests, setRequests] = useState([]);
  const [adminNote, setAdminNote] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      setErr('');
      const res = await api.get('/admin/users');
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('GET /admin/users failed', e);
      setErr('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      setErr('');
      const res = await api.get(`/roles/requests?status=${reqStatus}`);
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('GET /roles/requests failed', e);
      setErr('Failed to load role requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'users') loadUsers();
    if (tab === 'requests') loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, reqStatus]);

  // Actions — Users
  const banUser = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/ban`);
      loadUsers();
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to ban user');
    }
  };

  const unbanUser = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/unban`);
      loadUsers();
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to unban user');
    }
  };

  // Actions — Requests
  const approveReq = async (id) => {
    try {
      await api.patch(`/roles/requests/${id}/approve`, { adminNote });
      setAdminNote('');
      loadRequests();
      // optional: reload users to reflect role change
      if (tab !== 'users') loadUsers();
    } catch (e) {
      alert(e?.response?.data?.message || 'Approve failed');
    }
  };

  const rejectReq = async (id) => {
    try {
      await api.patch(`/roles/requests/${id}/reject`, { adminNote });
      setAdminNote('');
      loadRequests();
    } catch (e) {
      alert(e?.response?.data?.message || 'Reject failed');
    }
  };

  // Filtering users
  const filteredUsers = useMemo(() => {
    let out = users.slice();
    const qq = q.trim().toLowerCase();
    if (qq) {
      out = out.filter(
        (u) =>
          (u.name || '').toLowerCase().includes(qq) ||
          (u.email || '').toLowerCase().includes(qq)
      );
    }
    if (roleFilter !== 'all') {
      out = out.filter((u) => (u.role || '') === roleFilter);
    }
    if (statusFilter !== 'all') {
      out = out.filter((u) => (u.status || '') === statusFilter);
    }
    return out;
  }, [users, q, roleFilter, statusFilter]);

  return (
    <div className="au-wrap">
      <header className="au-head">
        <h1>Admin — Users & Role Requests</h1>
        <div className="au-tabs">
          <button
            className={`au-tab ${tab === 'users' ? 'active' : ''}`}
            onClick={() => setTab('users')}
          >
            Users
          </button>
          <button
            className={`au-tab ${tab === 'requests' ? 'active' : ''}`}
            onClick={() => setTab('requests')}
          >
            Role Requests
          </button>
        </div>
      </header>

      {err && <p className="error">{err}</p>}
      {loading && <p>Loading…</p>}

      {/* USERS TAB */}
      {tab === 'users' && (
        <>
          <div className="au-filters">
            <input
              placeholder="Search by name or email"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="all">All roles</option>
              <option value="Buyer">Buyer</option>
              <option value="Artist">Artist</option>
              <option value="Admin">Admin</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="banned">Banned</option>
            </select>
          </div>

          <table className="au-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Email</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className="u-cell">
                      <div className="avatar">👤</div>
                      <div>
                        <div className="u-name">{u.name || 'Unnamed'}</div>
                        <div className="u-id small">{u._id}</div>
                      </div>
                    </div>
                  </td>
                  <td>{u.role}</td>
                  <td>
                    <span className={`badge ${u.status}`}>{u.status}</span>
                  </td>
                  <td className="muted">{u.email}</td>
                  <td className="right">
                    {u.status !== 'banned' ? (
                      <button className="ban" onClick={() => banUser(u._id)}>Ban</button>
                    ) : (
                      <button className="unban" onClick={() => unbanUser(u._id)}>Unban</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && !filteredUsers.length && (
            <p className="muted">No users found.</p>
          )}
        </>
      )}

      {/* ROLE REQUESTS TAB */}
      {tab === 'requests' && (
        <>
          <div className="arr-controls">
            <div className="arr-tabs">
              {['pending', 'approved', 'rejected'].map((s) => (
                <button
                  key={s}
                  className={`arr-tab ${reqStatus === s ? 'active' : ''}`}
                  onClick={() => setReqStatus(s)}
                >
                  {s[0].toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <input
              className="note"
              type="text"
              placeholder="Admin note (optional)"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
            />
          </div>

          <ul className="arr-list">
            {requests.map((r) => (
              <li key={r._id} className="arr-item">
                <div className="arr-main">
                  <div className="arr-user">
                    <div className="avatar">👤</div>
                    <div>
                      <div className="u-name">{r.user?.name || 'Unknown'}</div>
                      <div className="u-email small">{r.user?.email || ''}</div>
                    </div>
                  </div>

                  <div className="arr-role">
                    <span className="badge">{r.currentRole}</span>
                    <span className="arrow">→</span>
                    <span className="badge target">{r.requestedRole}</span>
                  </div>

                  <div className="arr-meta">
                    <div className={`status ${r.status}`}>{r.status}</div>
                    <div className="small">{new Date(r.createdAt).toLocaleString()}</div>
                    {r.reason && <div className="muted">Reason: {r.reason}</div>}
                    {r.adminNote && <div>Admin Note: {r.adminNote}</div>}
                  </div>
                </div>

                {reqStatus === 'pending' && (
                  <div className="arr-actions">
                    <button className="approve" onClick={() => approveReq(r._id)}>Approve</button>
                    <button className="reject" onClick={() => rejectReq(r._id)}>Reject</button>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {!loading && !requests.length && (
            <p className="muted">No {reqStatus} requests.</p>
          )}
        </>
      )}
    </div>
  );
}
