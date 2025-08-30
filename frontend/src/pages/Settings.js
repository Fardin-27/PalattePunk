// src/pages/Settings.js
import React, { useState } from 'react';
import api from '../utils/api';

export default function Settings() {
  const [email, setEmail] = useState('');
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('');

  const updateEmail = async (e) => {
    e.preventDefault();
    try {
      await api.put('/settings/email', { email });
      setMsg('Email Changed');
      setMsgType('success');
      setEmail('');
    } catch {
      setMsg('Invalid');
      setMsgType('error');
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    try {
      await api.put('/settings/password', { oldPassword: oldPass, newPassword: newPass });
      setMsg('Password Changed');
      setMsgType('success');
      setOldPass('');
      setNewPass('');
    } catch {
      setMsg('Invalid');
      setMsgType('error');
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm('Delete your account?')) return;
    try {
      await api.delete('/settings/delete');
      setMsg('Account Deleted');
      setMsgType('success');
      localStorage.removeItem('token');
      window.location.href = '/login';
    } catch {
      setMsg('Invalid');
      setMsgType('error');
    }
  };

  const card = { border: '1px solid #ddd', borderRadius: 12, padding: 16, marginBottom: 20, background: '#fff' };
  const alert = {
    padding: '10px 14px',
    borderRadius: 8,
    marginTop: 12,
    fontWeight: 500,
    textAlign: 'center',
  };

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}>Settings</h2>

      <div style={card}>
        <h3>Change Email</h3>
        <form onSubmit={updateEmail} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="New email"
            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc' }}
          />
          <button type="submit" className="btn primary">
            Save
          </button>
        </form>
        {msgType === 'email-success' && <p style={{color:'#166534', marginTop:8}}>Email Changed</p>}
        {msgType === 'email-error' && <p style={{color:'#991b1b', marginTop:8}}>Invalid</p>}
      </div>

      <div style={card}>
        <h3>Change Password</h3>
        <form onSubmit={updatePassword} style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          <input
            type="password"
            value={oldPass}
            onChange={(e) => setOldPass(e.target.value)}
            placeholder="Current password"
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc' }}
          />
          <input
            type="password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            placeholder="New password"
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc' }}
          />
          <button type="submit" className="btn primary">
            Save
          </button>
        </form>
        {msgType === 'password-success' && <p style={{color:'#166534', marginTop:8}}>Password Changed</p>}
        {msgType === 'password-error' && <p style={{color:'#991b1b', marginTop:8}}>Invalid</p>}
      </div>

      <div style={card}>
        <h3>Delete Account</h3>
        <button
          type="button"
          onClick={deleteAccount}
          style={{
            background: '#ef4444',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: 8,
            border: 'none',
          }}
        >
          Delete my account
        </button>
      </div>

      {msg && (
        <div
          style={{
            ...alert,
            background: msgType === 'success' ? '#dcfce7' : '#fee2e2',
            color: msgType === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${msgType === 'success' ? '#22c55e' : '#ef4444'}`,
          }}
        >
          {msg}
        </div>
      )}
    </div>
  );
}
