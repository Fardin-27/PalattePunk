// src/pages/CreateAdminPage.js
import React, { useState } from 'react';
import api from '../utils/api';              // ⬅️ use the authorized client
import './CreateAdminPage.css';

export default function CreateAdminPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    try {
      // ⬅️ use api.post so Authorization header is sent
      const res = await api.post('/admin/create', form);
      setSuccess(res.data.message);
      setForm({ name: '', email: '', password: '' });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.status === 401 ? 'Not authorized' :
         err.response?.status === 403 ? 'Forbidden' : 'Something went wrong');
      setError(msg);
    }
  };

  return (
    <div className="create-admin-wrapper">
      <div className="create-admin-card">
        <h2 style={{ marginBottom: 12 }}>Create Admin</h2>
        <form onSubmit={handleSubmit} className="create-admin-form">
          <input
            type="text"
            name="name"
            placeholder="Admin Name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Admin Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button type="submit">Create Admin</button>
        </form>
        {success && <p className="success-msg">{success}</p>}
        {error && <p className="error-msg">{error}</p>}
      </div>
    </div>
  );
}
