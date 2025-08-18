// ✅ src/pages/AdminManageUsers.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';               // ← shared axios
import './AdminManageUsers.css';

export default function AdminManageUsers() {
  const [users, setUsers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadUsers = async () => {
    try {
      setError('');
      const res = await api.get('/admin/users');
      setUsers(res.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load users');
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const act = async (fn) => {
    try {
      setBusy(true);
      await fn();
      await loadUsers();
    } catch (e) {
      setError(e?.response?.data?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const ban     = (id) => act(() => api.patch(`/admin/users/${id}/ban`, { action: 'ban' }));
  const unban   = (id) => act(() => api.patch(`/admin/users/${id}/ban`, { action: 'unban' }));
  const setRole = (id, role) => act(() => api.patch(`/admin/users/${id}/role`, { role }));
  const makeAdmin = (id) => act(() => api.patch(`/admin/users/${id}/make-admin`));

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login?logout=1');
  };

  return (
    <div className="home-page-wrapper">
      {/* Left sidebar */}
      <aside className="sidebar">
        <h2 className="logo">PalettePunk</h2>
        <nav>
          <ul>
            <li onClick={() => navigate('/home')}>🏠 Home</li>
            <li onClick={() => navigate('/admin/create')}>➕ Create Admin</li>
            <li onClick={() => navigate('/admin/users')}>👥 Manage Users</li>
            <li>🗂️ Manage Contents</li>
            <li>🛍️ Manage Marketplace</li>
            <li>⚙️ Settings</li>
            <li onClick={logout} style={{ cursor: 'pointer' }}>🚪 Logout</li>
          </ul>
        </nav>
      </aside>

      <main className="main-content">
        <div className="admin-users-wrap">
          <h2>Manage Users</h2>
          {error && <p className="error-msg">{error}</p>}

          <div className="users-table">
            <div className="users-head row">
              <div>Name</div>
              <div>Email</div>
              <div>Role</div>
              <div>Status</div>
              <div>Actions</div>
            </div>

            {users.map((u) => (
              <div key={u._id} className="row">
                <div>{u.name}</div>
                <div>{u.email}</div>
                <div>{u.role}</div>
                <div>{u.status}</div>
                <div className="actions">
                  {u.status === 'active'
                    ? <button disabled={busy} onClick={() => ban(u._id)}>Ban</button>
                    : <button disabled={busy} onClick={() => unban(u._id)}>Unban</button>}
                  {u.role !== 'Artist' && (
                    <button disabled={busy} onClick={() => setRole(u._id, 'Artist')}>Make Artist</button>
                  )}
                  {u.role !== 'Buyer' && (
                    <button disabled={busy} onClick={() => setRole(u._id, 'Buyer')}>Make Buyer</button>
                  )}
                  {u.role !== 'Admin' && (
                    <button disabled={busy} onClick={() => makeAdmin(u._id)}>Promote to Admin</button>
                  )}
                </div>
              </div>
            ))}

            {users.length === 0 && <p style={{ marginTop: 12 }}>No users found.</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
