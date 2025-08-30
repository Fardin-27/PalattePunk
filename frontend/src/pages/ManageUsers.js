// src/pages/ManageUsers.js
import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import './ManageUsers.css';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
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

  useEffect(() => {
    load();
  }, []);

  const setRole = async (id, role) => {
    try {
      await api.patch(`/admin/users/${id}/role`, { role });
      await load();
    } catch (e) {
      console.error('PATCH role failed', e);
      alert('Could not change role');
    }
  };

  const makeAdmin = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/make-admin`);
      await load();
    } catch (e) {
      console.error('PATCH make-admin failed', e);
      alert('Could not promote to admin');
    }
  };

  const toggleBan = async (id, status) => {
    try {
      if (status === 'banned') {
        await api.patch(`/admin/users/${id}/unban`);
      } else {
        await api.patch(`/admin/users/${id}/ban`);
      }
      await load();
    } catch (e) {
      console.error('PATCH ban/unban failed', e);
      alert('Could not update ban status');
    }
  };

  // Only treat as a real, pending request if fields are present
  const pendingRequests = users.filter((u) => {
    const req = u.roleChangeRequest || null;
    return (
      req &&
      req.status === 'pending' &&
      req.requestedRole &&
      req.requestedAt
    );
  });

  return (
    <div className="mu-wrap">
      <h1 className="mu-title">Manage Users</h1>

      {/* Show the requests section ONLY when there are real pending requests */}
      {pendingRequests.length > 0 && (
        <section className="mu-card">
          <h2 className="mu-section-title">Role Change Requests</h2>
          <table className="mu-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Current</th>
                <th>Requested</th>
                <th>Reason</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map((u) => (
                <tr key={`req-${u._id}`}>
                  <td>
                    <div className="mu-user">
                      <span className="name">{u.name}</span>
                      <span className="email">({u.email})</span>
                    </div>
                  </td>
                  <td>{u.role}</td>
                  <td className="mu-badge mu-badge-info">
                    {u.roleChangeRequest?.requestedRole}
                  </td>
                  <td className="mu-reason">
                    {u.roleChangeRequest?.reason || '—'}
                  </td>
                  <td>
                    {u.roleChangeRequest?.requestedAt
                      ? new Date(u.roleChangeRequest.requestedAt).toLocaleString()
                      : '—'}
                  </td>
                  <td className="mu-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => setRole(u._id, u.roleChangeRequest?.requestedRole)}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-muted"
                      onClick={() => setRole(u._id, u.role)} // clears request server-side
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* All users table */}
      <section className="mu-card">
        <h2 className="mu-section-title">All Users</h2>

        {loading ? (
          <p className="mu-muted">Loading…</p>
        ) : err ? (
          <p className="mu-error">{err}</p>
        ) : (
          <table className="mu-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Role Tools</th>
                <th>Moderation</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isAdmin = u.role === 'Admin';
                const isBanned = u.status === 'banned';

                return (
                  <tr key={u._id}>
                    <td>
                      <div className="mu-user">
                        <span className="name">{u.name}</span>
                        <span className="email">({u.email})</span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={
                          u.role === 'Admin'
                            ? 'mu-badge mu-badge-admin'
                            : u.role === 'Artist'
                            ? 'mu-badge mu-badge-artist'
                            : 'mu-badge mu-badge-buyer'
                        }
                      >
                        {u.role}
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          isBanned ? 'mu-status mu-status-banned' : 'mu-status mu-status-active'
                        }
                      >
                        {u.status}
                      </span>
                    </td>

                    <td className="mu-actions">
                      <button
                        className="btn btn-primary"
                        disabled={isAdmin || u.role === 'Buyer'}
                        onClick={() => setRole(u._id, 'Buyer')}
                      >
                        Set Buyer
                      </button>
                      <button
                        className="btn btn-primary"
                        disabled={isAdmin || u.role === 'Artist'}
                        onClick={() => setRole(u._id, 'Artist')}
                      >
                        Set Artist
                      </button>
                    </td>

                    <td className="mu-actions">
                      <button
                        className="btn btn-danger"
                        disabled={isAdmin}
                        onClick={() => makeAdmin(u._id)}
                      >
                        Make Admin
                      </button>

                      <button
                        className="btn btn-warning"
                        onClick={() => toggleBan(u._id, u.status)}
                      >
                        {isBanned ? 'Unban' : 'Ban'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
