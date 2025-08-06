// ✅ src/pages/LoginPage.js
import React, { useState } from 'react';
import axios from 'axios';
import { saveToken } from '../utils/auth';
import { Link } from 'react-router-dom';
import './AuthPage.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', formData);
      saveToken(response.data.token);
      window.location.href = '/home';
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="auth-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="auth-card">
        <h1 style={{ fontSize: '32px', marginBottom: '10px', color: 'crimson' }}>PalettePunk</h1>
        <h2>Welcome to PalettePunk</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <div className="password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <span
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '🙈' : '👁️'}
            </span>
          </div>

          <button type="submit">Log in</button>

          <div className="divider">OR</div>
        </form>

        <span className="switch-link">
          New here? <Link to="/register">Create an account</Link>
        </span>

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
};

export default LoginPage;
