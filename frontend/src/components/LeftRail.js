// ✅ src/components/LeftRail.js (icons-only + collapsible Admin tools)
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { decodeToken } from '../utils/auth';
import './LeftRail.css';

const Item = ({ icon, label, onClick, active }) => (
  <button
    type="button"
    className={`lr-item ${active ? 'active' : ''}`}
    onClick={onClick}
    aria-label={label}
    title={label}
  >
    <span className="lr-ico" aria-hidden="true">{icon}</span>
    <span className="lr-label">{label}</span> {/* hidden in CSS */}
  </button>
);

export default function LeftRail() {
  const nav = useNavigate();
  const loc = useLocation();
  const token = localStorage.getItem('token');
  const role = token ? decodeToken(token)?.role : '';

  const [adminOpen, setAdminOpen] = useState(false); // 👈 collapsed by default

  const go = (to) => () => nav(to);
  const logout = () => {
    localStorage.removeItem('token');
    nav('/login?logout=1');
  };

  // Shown to everyone
  const base = [
    { icon: '🏠', label: 'Home', to: '/home' },
    { icon: '🛍️', label: 'Market', to: '/market' },
    { icon: '🔍', label: 'Explore', to: '/explore' },
    { icon: '🔔', label: 'Notifications', to: '/notifications' },
    { icon: '💬', label: 'Messages', to: '/messages' },
    { icon: '👤', label: 'Profile', to: '/profile' },
    { icon: '⚙️', label: 'Settings', to: '/settings' },
  ];

  // Artist quick action
  const artistOnly = [{ icon: '➕', label: 'Post', to: '/post' }];

  // Admin tools (hidden until 🛡️ toggled)
  const adminOnly = [
    { icon: '➕',  label: 'Create Admin',    to: '/admin/create' },
    { icon: '👥',  label: 'Manage Users',    to: '/admin/users' },
    { icon: '🖼️', label: 'Manage Artworks', to: '/admin/artworks' },
  ];

  // Build main list (icons only)
  const itemsTop = [...base.slice(0, 3)];
  const itemsBottom = [...base.slice(3)];

  return (
    <aside className="left-rail">
      {/* top logo */}
      <button
        type="button"
        className="lr-logo"
        onClick={go('/home')}
        aria-label="PalettePunk"
        title="PalettePunk"
      >
        <img
          src={require('../assets/logo.png')}
          alt="PalettePunk logo"
          style={{ width: 32, height: 32 }}
        />
      </button>


      {/* top core icons (Home/Market/Explore) */}
      <nav className="lr-nav">
        {itemsTop.map((it) => (
          <Item
            key={it.label}
            icon={it.icon}
            label={it.label}
            active={loc.pathname === it.to}
            onClick={go(it.to)}
          />
        ))}

        {/* Artist: Post */}
        {role === 'Artist' && (
          <Item
            icon="➕"
            label="Post"
            active={loc.pathname === '/post'}
            onClick={go('/post')}
          />
        )}

        {/* Admin: collapsible tools */}
        {role === 'Admin' && (
          <>
            {/* Toggle button (doesn't navigate) */}
            <Item
              icon="🛡️"
              label={adminOpen ? 'Hide Admin' : 'Admin Tools'}
              active={adminOpen}
              onClick={() => setAdminOpen((s) => !s)}
            />
            {/* Conditionally render admin icons below */}
            {adminOpen && adminOnly.map((it) => (
              <Item
                key={it.label}
                icon={it.icon}
                label={it.label}
                active={loc.pathname === it.to}
                onClick={go(it.to)}
              />
            ))}
          </>
        )}

        {/* The rest (Notifications/Messages/Profile/Settings) */}
        {itemsBottom.map((it) => (
          <Item
            key={it.label}
            icon={it.icon}
            label={it.label}
            active={loc.pathname === it.to}
            onClick={go(it.to)}
          />
        ))}
      </nav>

      {/* pinned logout */}
      <div className="lr-bottom">
        <button
          type="button"
          className="lr-item"
          onClick={logout}
          aria-label="Logout"
          title="Logout"
        >
          <span className="lr-ico" aria-hidden="true">🚪</span>
          <span className="lr-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}
