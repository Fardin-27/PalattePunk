// ✅ src/pages/RegisterPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './AuthPage.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Buyer',       // default
    password: '',
    confirm: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm) {
      return setError('Passwords do not match');
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role, // "Buyer" | "Artist"
      };
      await api.post('/auth/register', payload);
      // After register, go to login
      navigate('/login', { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Registration failed';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="auth-page"
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
    >
      <div className="auth-card">
        <h1 style={{ fontSize: '32px', marginBottom: '10px', color: 'crimson' }}>PalettePunk</h1>
        <h2>Create your account</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Full name"
            value={formData.name}
            onChange={handleChange}
            required
            autoFocus
          />

          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <div className="select-wrapper">
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="Buyer">Buyer</option>
              <option value="Artist">Artist</option>
            </select>
          </div>

          <div className="password-wrapper">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="password-wrapper">
            <input
              type="password"
              name="confirm"
              placeholder="Confirm password"
              value={formData.confirm}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create account'}
          </button>

          <div className="divider">OR</div>
        </form>

        <span className="switch-link">
          Already have an account? <Link to="/login">Log in</Link>
        </span>

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
};

export default RegisterPage;
